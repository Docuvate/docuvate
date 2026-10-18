//go:build integration

package integration_test

import (
	"context"
	"fmt"
	"net"
	"os"
	"path"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pkg/sftp"
	"golang.org/x/crypto/ssh"
)

func TestSftpUploadCreatesScannerDocument(t *testing.T) {
	skipUnlessE2E(t)
	host, port := sftpEndpoint()
	user := env("DOCUVATE_SFTP_E2E_USER", "e2e-scan-upload")
	pass := env("DOCUVATE_SFTP_E2E_PASSWORD", "E2eSftpUpload9!")
	ownerID := env("DOCUVATE_E2E_USER_ID", "local-dev-owner")

	client, conn := dialSftp(t, host, port, user, pass)
	defer conn.Close()
	defer client.Close()

	name := fmt.Sprintf("e2e-scan-%d.pdf", time.Now().UnixNano())
	f, err := client.Create(path.Join("/", name))
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	pdf := []byte("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n")
	if _, err := f.Write(pdf); err != nil {
		t.Fatalf("write: %v", err)
	}
	if err := f.Close(); err != nil {
		t.Fatalf("close: %v", err)
	}

	pool := dbPool(t)
	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()
	var ingestSource *string
	var docID *string
	for {
		err := pool.QueryRow(ctx, `
			SELECT d.id::text, d.ingest_source
			FROM documents d
			WHERE d.user_id = $1 AND d.title = $2
			ORDER BY d.created_at DESC
			LIMIT 1`, ownerID, name).Scan(&docID, &ingestSource)
		if err == nil && docID != nil && ingestSource != nil && *ingestSource == "scanner_sftp" {
			break
		}
		select {
		case <-ctx.Done():
			t.Fatalf("timed out waiting for document ingest: %v", ctx.Err())
		case <-time.After(2 * time.Second):
		}
	}
}

func TestSftpLoginLockoutAfterBadPasswords(t *testing.T) {
	skipUnlessE2E(t)
	host, port := sftpEndpoint()
	user := env("DOCUVATE_SFTP_E2E_LOCKOUT_USER", "e2e-scan-lockout")
	wrong := "definitely-wrong-password"

	for i := 0; i < 6; i++ {
		_, err := ssh.Dial("tcp", net.JoinHostPort(host, port), &ssh.ClientConfig{
			User:            user,
			Auth:            []ssh.AuthMethod{ssh.Password(wrong)},
			HostKeyCallback: ssh.InsecureIgnoreHostKey(),
			Timeout:         10 * time.Second,
		})
		if err == nil {
			t.Fatal("expected auth failure")
		}
	}
	_, err := ssh.Dial("tcp", net.JoinHostPort(host, port), &ssh.ClientConfig{
		User:            user,
		Auth:            []ssh.AuthMethod{ssh.Password(wrong)},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         10 * time.Second,
	})
	if err == nil {
		t.Fatal("expected lockout to block login")
	}

	pool := dbPool(t)
	ctx := context.Background()
	var lockedCount int
	err = pool.QueryRow(ctx, `
		SELECT COUNT(*)::int FROM sftp_ingress_audit a
		LEFT JOIN sftp_ingress_accounts acc ON acc.id = a.account_id
		WHERE a.kind = 'sftp.login_locked'
		  AND (
		    lower(a.attempted_username) = lower($1)
		    OR lower(acc.username) = lower($1)
		  )`, user).Scan(&lockedCount)
	if err != nil {
		t.Fatalf("audit query: %v", err)
	}
	if lockedCount < 1 {
		t.Fatalf("expected sftp.login_locked audit events, got %d", lockedCount)
	}
}

func skipUnlessE2E(t *testing.T) {
	t.Helper()
	if os.Getenv("DOCUVATE_SFTP_E2E") != "1" {
		t.Skip("set DOCUVATE_SFTP_E2E=1 with compose stack running")
	}
}

func sftpEndpoint() (string, string) {
	host := env("DOCUVATE_SFTP_HOST", "127.0.0.1")
	port := env("DOCUVATE_SFTP_PORT", "2222")
	return host, port
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func dialSftp(t *testing.T, host, port, user, pass string) (*sftp.Client, *ssh.Client) {
	t.Helper()
	conn, err := ssh.Dial("tcp", net.JoinHostPort(host, port), &ssh.ClientConfig{
		User:            user,
		Auth:            []ssh.AuthMethod{ssh.Password(pass)},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         15 * time.Second,
	})
	if err != nil {
		t.Fatalf("ssh dial: %v", err)
	}
	client, err := sftp.NewClient(conn)
	if err != nil {
		conn.Close()
		t.Fatalf("sftp client: %v", err)
	}
	return client, conn
}

func dbPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	url := env("DATABASE_URL", "postgresql://docuvate:docuvate@localhost:5433/docuvate")
	pool, err := pgxpool.New(context.Background(), url)
	if err != nil {
		t.Fatalf("db pool: %v", err)
	}
	t.Cleanup(func() { pool.Close() })
	return pool
}
