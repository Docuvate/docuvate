package pull

import (
	"errors"
	"fmt"
	"io"
	"net"
	"os"
	"strings"
	"time"

	"github.com/pkg/sftp"
	gossh "golang.org/x/crypto/ssh"

	"github.com/docuvate/sftp-ingest/internal/security"
)

const maxFetchBytes = 26_214_400

type Config struct {
	Host               string
	Port               int
	Username           string
	Password           string
	PrivateKeyPEM      string
	RemotePath         string
	HostKeyFingerprint string
}

type RemoteFile struct {
	Path      string `json:"path"`
	Name      string `json:"name"`
	SizeBytes int64  `json:"sizeBytes"`
}

var errProbeCaptured = errors.New("probe: host key captured")

func ProbeHostKey(cfg Config) (string, error) {
	var fingerprint string
	_, err := dial(cfg, func(_ string, _ net.Addr, key gossh.PublicKey) error {
		fingerprint = security.FingerprintSHA256(key)
		return errProbeCaptured
	}, false)
	if err != nil && !errors.Is(err, errProbeCaptured) && fingerprint == "" {
		return "", err
	}
	if fingerprint == "" {
		return "", fmt.Errorf("host key missing")
	}
	return fingerprint, nil
}

func ListFiles(cfg Config, limit int) ([]RemoteFile, error) {
	client, err := dial(cfg, pinnedVerifier(cfg.HostKeyFingerprint), true)
	if err != nil {
		return nil, err
	}
	defer client.Close()
	sftpClient, err := sftp.NewClient(client)
	if err != nil {
		return nil, err
	}
	defer sftpClient.Close()
	entries, err := sftpClient.ReadDir(cfg.RemotePath)
	if err != nil {
		return nil, err
	}
	var out []RemoteFile
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		if strings.HasPrefix(name, ".") {
			continue
		}
		ref := joinRemote(cfg.RemotePath, name)
		out = append(out, RemoteFile{Path: ref, Name: name, SizeBytes: entry.Size()})
		if len(out) >= limit {
			break
		}
	}
	return out, nil
}

func FetchFile(cfg Config, ref string) ([]byte, error) {
	client, err := dial(cfg, pinnedVerifier(cfg.HostKeyFingerprint), true)
	if err != nil {
		return nil, err
	}
	defer client.Close()
	sftpClient, err := sftp.NewClient(client)
	if err != nil {
		return nil, err
	}
	defer sftpClient.Close()
	f, err := sftpClient.Open(ref)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	limited := io.LimitReader(f, maxFetchBytes+1)
	data, err := io.ReadAll(limited)
	if err != nil {
		return nil, err
	}
	if len(data) > maxFetchBytes {
		return nil, fmt.Errorf("file too large")
	}
	return data, nil
}

func DeleteRemote(cfg Config, ref string) error {
	client, err := dial(cfg, pinnedVerifier(cfg.HostKeyFingerprint), true)
	if err != nil {
		return err
	}
	defer client.Close()
	sftpClient, err := sftp.NewClient(client)
	if err != nil {
		return err
	}
	defer sftpClient.Close()
	return sftpClient.Remove(ref)
}

func MoveRemote(cfg Config, ref, archiveDir, name string) error {
	client, err := dial(cfg, pinnedVerifier(cfg.HostKeyFingerprint), true)
	if err != nil {
		return err
	}
	defer client.Close()
	sftpClient, err := sftp.NewClient(client)
	if err != nil {
		return err
	}
	defer sftpClient.Close()
	destDir := joinRemote(cfg.RemotePath, archiveDir)
	_ = sftpClient.Mkdir(destDir)
	dest := joinRemote(destDir, name)
	return sftpClient.Rename(ref, dest)
}

func joinRemote(base, name string) string {
	if strings.HasSuffix(base, "/") {
		return base + name
	}
	return base + "/" + name
}

func dial(cfg Config, verify gossh.HostKeyCallback, withCredentials bool) (*gossh.Client, error) {
	allowlist := security.ParseAllowlist()
	addr, err := security.ResolveDialAddr(cfg.Host, cfg.Port, allowlist)
	if err != nil {
		return nil, err
	}
	auth := []gossh.AuthMethod{}
	if withCredentials {
		if cfg.Password != "" {
			auth = append(auth, gossh.Password(cfg.Password))
		}
		if cfg.PrivateKeyPEM != "" {
			signer, err := gossh.ParsePrivateKey([]byte(cfg.PrivateKeyPEM))
			if err != nil {
				return nil, err
			}
			auth = append(auth, gossh.PublicKeys(signer))
		}
	}
	config := &gossh.ClientConfig{
		User:            cfg.Username,
		Auth:            auth,
		HostKeyCallback: verify,
		Timeout:         20 * time.Second,
	}
	return security.DialSSH(addr, config)
}

func pinnedVerifier(expected string) gossh.HostKeyCallback {
	return func(_ string, _ net.Addr, key gossh.PublicKey) error {
		fp := security.FingerprintSHA256(key)
		if !security.FingerprintsEqual(fp, expected) {
			return fmt.Errorf("host key mismatch")
		}
		return nil
	}
}

func WriteTempKey(pem string) (string, error) {
	if pem == "" {
		return "", nil
	}
	f, err := os.CreateTemp("", "docuvate-sftp-key-*.pem")
	if err != nil {
		return "", err
	}
	if _, err := f.WriteString(pem); err != nil {
		return "", err
	}
	f.Close()
	return f.Name(), nil
}

func CleanupTempKey(path string) {
	if path != "" {
		_ = os.Remove(path)
	}
}
