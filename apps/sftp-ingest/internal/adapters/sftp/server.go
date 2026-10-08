package sftpadapter

import (
	"context"
	"crypto/ed25519"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"io"
	"log/slog"
	"net"
	"os"
	"path/filepath"
	"strings"
	"time"

	gliderssh "github.com/gliderlabs/ssh"
	"github.com/pkg/sftp"
	gossh "golang.org/x/crypto/ssh"

	"github.com/docuvate/sftp-ingest/internal/ports"
	"github.com/docuvate/sftp-ingest/internal/security"
)

type Config struct {
	ListenAddr                string
	HostKeyPath               string
	DataDir                   string
	MaxFileBytes              int64
	MaxPendingBytesPerAccount int64
	Limiter                   *security.Limiter
}

type Server struct {
	cfg     Config
	creds   ports.CredentialStorePort
	ingest  ports.IngestPort
	audit   ports.AuditPort
	logger  *slog.Logger
	signer  gossh.Signer
}

func NewServer(cfg Config, creds ports.CredentialStorePort, ingest ports.IngestPort, audit ports.AuditPort, logger *slog.Logger) (*Server, error) {
	info, err := EnsureHostKey(cfg.HostKeyPath)
	if err != nil {
		return nil, err
	}
	keyBytes, err := os.ReadFile(cfg.HostKeyPath)
	if err != nil {
		return nil, err
	}
	signer, err := gossh.ParsePrivateKey(keyBytes)
	if err != nil {
		return nil, err
	}
	logger.Info("sftp host key ready", "fingerprintSha256", info.FingerprintSHA256)
	if cfg.Limiter == nil {
		cfg.Limiter = security.NewLimiter(security.DefaultConfig())
	}
	return &Server{cfg: cfg, creds: creds, ingest: ingest, audit: audit, logger: logger, signer: signer}, nil
}

func (s *Server) HostKeyFingerprint() ports.HostKeyInfo {
	sum := sha256.Sum256(s.signer.PublicKey().Marshal())
	return ports.HostKeyInfo{FingerprintSHA256: base64.StdEncoding.EncodeToString(sum[:])}
}

func (s *Server) ListenAndServe(ctx context.Context) error {
	server := gliderssh.Server{
		Addr:             s.cfg.ListenAddr,
		Handler:          func(sess gliderssh.Session) { _ = sess.Exit(1) },
		PasswordHandler:  s.passwordHandler,
		PublicKeyHandler: s.publicKeyHandler,
		RequestHandlers: map[string]gliderssh.RequestHandler{
			"tcpip-forward":                 denyForwardRequest,
			"direct-tcpip":                  denyForwardRequest,
			"streamlocal-forward@openssh.com": denyForwardRequest,
		},
		SessionRequestCallback: func(_ gliderssh.Session, requestType string) bool {
			switch requestType {
			case "shell", "exec", "pty-req":
				return false
			default:
				return true
			}
		},
	}
	server.AddHostKey(s.signer)
	server.SubsystemHandlers = map[string]gliderssh.SubsystemHandler{
		"sftp": s.handleSftp,
	}
	go func() {
		<-ctx.Done()
		_ = server.Shutdown(context.Background())
	}()
	return server.ListenAndServe()
}

func (s *Server) handleSftp(sess gliderssh.Session) {
	auth, err := s.creds.ResolveByUsername(context.Background(), sess.User())
	if err != nil {
		_ = sess.Exit(1)
		return
	}
	root := filepath.Join(s.cfg.DataDir, auth.AccountID)
	_ = os.MkdirAll(root, 0o700)
	_ = os.MkdirAll(filepath.Join(root, "failed"), 0o700)
	handlers := sftp.Handlers{
		FileGet:  uploadOnlyDeny{},
		FilePut:  writeRoot{root: root, server: s, accountID: auth.AccountID},
		FileCmd:  cmdRoot{root: root, server: s, accountID: auth.AccountID},
		FileList: uploadOnlyDeny{},
	}
	server := sftp.NewRequestServer(sess, handlers)
	_ = server.Serve()
	_ = server.Close()
}

func denyForwardRequest(_ gliderssh.Context, _ *gliderssh.Server, _ *gossh.Request) (bool, []byte) {
	return false, nil
}

type uploadOnlyDeny struct{}

func (uploadOnlyDeny) Fileread(_ *sftp.Request) (io.ReaderAt, error) {
	return nil, os.ErrPermission
}

func (uploadOnlyDeny) Filelist(_ *sftp.Request) (sftp.ListerAt, error) {
	return nil, os.ErrPermission
}

func (s *Server) passwordHandler(ctx gliderssh.Context, password string) bool {
	return s.login(ctx, password, "")
}

func (s *Server) publicKeyHandler(ctx gliderssh.Context, key gliderssh.PublicKey) bool {
	return s.login(ctx, "", string(gossh.MarshalAuthorizedKey(key)))
}

func (s *Server) login(ctx gliderssh.Context, password, publicKey string) bool {
	ip := remoteIP(ctx)
	now := time.Now()
	if !s.cfg.Limiter.CheckIP(ip, now) {
		s.recordAudit("sftp.login_locked", ctx.User(), ip, "")
		return false
	}
	if s.cfg.Limiter.CheckAccount(ctx.User(), now) {
		s.recordAudit("sftp.login_locked", ctx.User(), ip, "")
		return false
	}
	authResult, err := s.creds.Authenticate(context.Background(), ports.AuthRequest{
		Username:  ctx.User(),
		Password:  password,
		PublicKey: publicKey,
		ClientIP:  ip,
	})
	ok := err == nil
	accountID := authResult.AccountID
	outcome := s.cfg.Limiter.RecordLogin(ctx.User(), ok, now)
	switch outcome {
	case security.OutcomeOK:
		s.recordAudit("sftp.login_ok", ctx.User(), ip, accountID)
		return true
	case security.OutcomeLocked:
		s.recordAudit("sftp.login_locked", ctx.User(), ip, accountID)
		return false
	default:
		s.recordAudit("sftp.login_failed", ctx.User(), ip, accountID)
		return false
	}
}

func (s *Server) recordAudit(kind, username, ip, accountID string) {
	if s.audit == nil {
		return
	}
	_ = s.audit.Record(context.Background(), ports.AuditEvent{
		Kind: kind, Username: username, ClientIP: ip, AccountID: accountID,
	})
}

func remoteIP(ctx gliderssh.Context) string {
	host, _, err := net.SplitHostPort(ctx.RemoteAddr().String())
	if err != nil {
		return ctx.RemoteAddr().String()
	}
	return host
}

type writeRoot struct {
	root      string
	server    *Server
	accountID string
}

func (w writeRoot) Filewrite(req *sftp.Request) (io.WriterAt, error) {
	path, err := security.SafeUploadPath(w.root, req.Filepath)
	if err != nil {
		return nil, err
	}
	if err := w.server.ensureQuota(w.root); err != nil {
		return nil, os.ErrPermission
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return nil, err
	}
	if err := security.RejectSymlinkPath(path); err != nil {
		return nil, err
	}
	file, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o600)
	if err != nil {
		return nil, err
	}
	return &closeTrackWriter{
		File:       file,
		path:       path,
		remotePath: req.Filepath,
		server:     w.server,
		accountID:  w.accountID,
	}, nil
}

type closeTrackWriter struct {
	*os.File
	path       string
	remotePath string
	server     *Server
	accountID  string
}

func (w *closeTrackWriter) Close() error {
	if err := w.File.Close(); err != nil {
		return err
	}
	go w.server.finalizeUpload(w.accountID, w.path, w.remotePath)
	return nil
}

type cmdRoot struct {
	root      string
	server    *Server
	accountID string
}

func (c cmdRoot) Filecmd(req *sftp.Request) error {
	switch req.Method {
	case "Rename":
		oldPath, err := security.SafeUploadPath(c.root, req.Filepath)
		if err != nil {
			return err
		}
		newPath, err := security.SafeUploadPath(c.root, req.Target)
		if err != nil {
			return err
		}
		if err := os.Rename(oldPath, newPath); err != nil {
			return err
		}
		go c.server.finalizeUpload(c.accountID, newPath, req.Target)
		return nil
	case "Remove", "Setstat", "Mkdir", "Rmdir":
		return os.ErrPermission
	default:
		return os.ErrPermission
	}
}

func (s *Server) ensureQuota(root string) error {
	if s.cfg.MaxPendingBytesPerAccount <= 0 {
		return nil
	}
	var total int64
	_ = filepath.WalkDir(root, func(path string, d os.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return nil
		}
		if strings.Contains(path, string(filepath.Separator)+"failed"+string(filepath.Separator)) {
			return nil
		}
		info, err := d.Info()
		if err != nil {
			return nil
		}
		total += info.Size()
		return nil
	})
	if total >= s.cfg.MaxPendingBytesPerAccount {
		return os.ErrPermission
	}
	return nil
}

func (s *Server) finalizeUpload(accountID, path, remotePath string) {
	name := filepath.Base(path)
	if isTemporaryName(name) {
		return
	}
	time.Sleep(500 * time.Millisecond)
	info1, err := os.Stat(path)
	if err != nil {
		return
	}
	size1 := info1.Size()
	time.Sleep(400 * time.Millisecond)
	info2, err := os.Stat(path)
	if err != nil || info2.Size() != size1 {
		return
	}
	content, err := os.ReadFile(path)
	if err != nil {
		return
	}
	if s.cfg.MaxFileBytes > 0 && int64(len(content)) > s.cfg.MaxFileBytes {
		_ = s.moveFailed(path)
		return
	}
	result, err := s.ingest.Ingest(context.Background(), ports.IngestRequest{
		AccountID:  accountID,
		Filename:   name,
		RemotePath: remotePath,
		Content:    content,
	})
	if err != nil || result.Rejected {
		_ = s.moveFailed(path)
		return
	}
	_ = os.Remove(path)
}

func (s *Server) moveFailed(path string) error {
	failed := filepath.Join(filepath.Dir(path), "failed", filepath.Base(path))
	return os.Rename(path, failed)
}

func isTemporaryName(name string) bool {
	lower := strings.ToLower(name)
	return strings.HasSuffix(lower, ".tmp") || strings.HasSuffix(lower, ".part") || strings.HasSuffix(lower, "~")
}

type listerAt []os.FileInfo

func (l listerAt) ListAt(f []os.FileInfo, offset int64) (int, error) {
	if offset >= int64(len(l)) {
		return 0, io.EOF
	}
	n := copy(f, l[offset:])
	if int(offset)+n >= len(l) {
		return n, io.EOF
	}
	return n, nil
}

func EnsureHostKey(path string) (ports.HostKeyInfo, error) {
	if _, err := os.Stat(path); err == nil {
		keyBytes, err := os.ReadFile(path)
		if err != nil {
			return ports.HostKeyInfo{}, err
		}
		signer, err := gossh.ParsePrivateKey(keyBytes)
		if err != nil {
			return ports.HostKeyInfo{}, err
		}
		sum := sha256.Sum256(signer.PublicKey().Marshal())
		return ports.HostKeyInfo{FingerprintSHA256: base64.StdEncoding.EncodeToString(sum[:])}, nil
	}
	pub, priv, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return ports.HostKeyInfo{}, err
	}
	block, err := x509.MarshalPKCS8PrivateKey(priv)
	if err != nil {
		return ports.HostKeyInfo{}, err
	}
	pemBytes := pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: block})
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return ports.HostKeyInfo{}, err
	}
	if err := os.WriteFile(path, pemBytes, 0o600); err != nil {
		return ports.HostKeyInfo{}, err
	}
	sshPub, err := gossh.NewPublicKey(pub)
	if err != nil {
		return ports.HostKeyInfo{}, err
	}
	sum := sha256.Sum256(sshPub.Marshal())
	return ports.HostKeyInfo{FingerprintSHA256: base64.StdEncoding.EncodeToString(sum[:])}, nil
}
