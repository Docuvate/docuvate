package ports

import "context"

type AuthRequest struct {
	Username  string
	Password  string
	PublicKey string
	ClientIP  string
}

type AuthResult struct {
	AccountID string
	UserID    string
}

type IngestRequest struct {
	AccountID  string
	Filename   string
	RemotePath string
	Content    []byte
}

type IngestResult struct {
	DocumentID *string
	Rejected   bool
	ReasonKey  string
}

type AuditEvent struct {
	Kind      string `json:"kind"`
	Username  string `json:"username"`
	ClientIP  string `json:"clientIp"`
	AccountID string `json:"accountId,omitempty"`
}

type CredentialStorePort interface {
	Authenticate(ctx context.Context, req AuthRequest) (AuthResult, error)
	ResolveByUsername(ctx context.Context, username string) (AuthResult, error)
}

type IngestPort interface {
	Ingest(ctx context.Context, req IngestRequest) (IngestResult, error)
}

type AuditPort interface {
	Record(ctx context.Context, event AuditEvent) error
}

type HostKeyInfo struct {
	FingerprintSHA256 string
}

type HealthReporter interface {
	HostKeyFingerprint() HostKeyInfo
}
