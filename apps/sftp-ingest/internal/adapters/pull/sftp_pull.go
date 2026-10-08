package pull

import (
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
	"net"
	"os"
	"strings"
	"time"

	"github.com/pkg/sftp"
	gossh "golang.org/x/crypto/ssh"
)

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

func ProbeHostKey(cfg Config) (string, error) {
	var fingerprint string
	client, err := dial(cfg, func(_ string, _ net.Addr, key gossh.PublicKey) error {
		sum := sha256.Sum256(key.Marshal())
		fingerprint = base64.StdEncoding.EncodeToString(sum[:])
		return nil
	})
	if err != nil {
		return "", err
	}
	client.Close()
	if fingerprint == "" {
		return "", fmt.Errorf("host key missing")
	}
	return fingerprint, nil
}

func ListFiles(cfg Config, limit int) ([]RemoteFile, error) {
	client, err := dial(cfg, pinnedVerifier(cfg.HostKeyFingerprint))
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
	client, err := dial(cfg, pinnedVerifier(cfg.HostKeyFingerprint))
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
	return io.ReadAll(f)
}

func DeleteRemote(cfg Config, ref string) error {
	client, err := dial(cfg, pinnedVerifier(cfg.HostKeyFingerprint))
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
	client, err := dial(cfg, pinnedVerifier(cfg.HostKeyFingerprint))
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

func dial(cfg Config, verify gossh.HostKeyCallback) (*gossh.Client, error) {
	auth := []gossh.AuthMethod{}
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
	config := &gossh.ClientConfig{
		User:            cfg.Username,
		Auth:            auth,
		HostKeyCallback: verify,
		Timeout:         20 * time.Second,
	}
	addr := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)
	return gossh.Dial("tcp", addr, config)
}

func pinnedVerifier(expected string) gossh.HostKeyCallback {
	return func(_ string, _ net.Addr, key gossh.PublicKey) error {
		sum := sha256.Sum256(key.Marshal())
		fp := base64.StdEncoding.EncodeToString(sum[:])
		if fp != expected {
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
