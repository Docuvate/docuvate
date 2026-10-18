package httpadapter

import (
	"crypto/subtle"
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/docuvate/sftp-ingest/internal/adapters/pull"
)

const maxJSONBodyBytes = 1 << 20

type pullProbeRequest struct {
	Host       string `json:"host"`
	Port       int    `json:"port"`
	Username   string `json:"username"`
	Password   string `json:"password"`
	PrivateKey string `json:"privateKey"`
}

var probeLimiter = newIPRateLimiter(10, time.Minute)

func PullProbeHandler(apiKey string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !authorized(r, apiKey) {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		if !probeLimiter.allow(clientIP(r)) {
			http.Error(w, "rate limited", http.StatusTooManyRequests)
			return
		}
		var body pullProbeRequest
		if err := decodeJSON(w, r, &body); err != nil {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}
		fp, err := pull.ProbeHostKey(pull.Config{
			Host: body.Host, Port: body.Port, Username: body.Username,
			RemotePath: "/",
		})
		if err != nil {
			http.Error(w, "probe failed", http.StatusBadGateway)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]string{"hostKeyFingerprintSha256": fp})
	}
}

type pullListRequest struct {
	pullProbeRequest
	RemotePath         string `json:"remotePath"`
	HostKeyFingerprint string `json:"hostKeyFingerprint"`
	Limit              int    `json:"limit"`
}

func PullListHandler(apiKey string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !authorized(r, apiKey) {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		var body pullListRequest
		if err := decodeJSON(w, r, &body); err != nil {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}
		limit := body.Limit
		if limit <= 0 {
			limit = 20
		}
		files, err := pull.ListFiles(pull.Config{
			Host: body.Host, Port: body.Port, Username: body.Username,
			Password: body.Password, PrivateKeyPEM: body.PrivateKey,
			RemotePath: body.RemotePath, HostKeyFingerprint: body.HostKeyFingerprint,
		}, limit)
		if err != nil {
			http.Error(w, "list failed", http.StatusBadGateway)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"files": files})
	}
}

type pullFetchRequest struct {
	pullListRequest
	Ref string `json:"ref"`
}

func PullFetchHandler(apiKey string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !authorized(r, apiKey) {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		var body pullFetchRequest
		if err := decodeJSON(w, r, &body); err != nil {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}
		data, err := pull.FetchFile(pull.Config{
			Host: body.Host, Port: body.Port, Username: body.Username,
			Password: body.Password, PrivateKeyPEM: body.PrivateKey,
			RemotePath: body.RemotePath, HostKeyFingerprint: body.HostKeyFingerprint,
		}, body.Ref)
		if err != nil {
			http.Error(w, "fetch failed", http.StatusBadGateway)
			return
		}
		w.Header().Set("Content-Type", "application/octet-stream")
		w.Header().Set("Content-Length", strconv.Itoa(len(data)))
		_, _ = w.Write(data)
	}
}

type pullPostProcessRequest struct {
	pullListRequest
	Ref         string `json:"ref"`
	AfterImport string `json:"afterImport"`
	ArchivePath string `json:"archivePath"`
	Filename    string `json:"filename"`
}

func PullPostProcessHandler(apiKey string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !authorized(r, apiKey) {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		var body pullPostProcessRequest
		if err := decodeJSON(w, r, &body); err != nil {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}
		cfg := pull.Config{
			Host: body.Host, Port: body.Port, Username: body.Username,
			Password: body.Password, PrivateKeyPEM: body.PrivateKey,
			RemotePath: body.RemotePath, HostKeyFingerprint: body.HostKeyFingerprint,
		}
		var err error
		if body.AfterImport == "move" {
			err = pull.MoveRemote(cfg, body.Ref, body.ArchivePath, body.Filename)
		} else {
			err = pull.DeleteRemote(cfg, body.Ref)
		}
		if err != nil {
			http.Error(w, "post-process failed", http.StatusBadGateway)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}

func authorized(r *http.Request, apiKey string) bool {
	header := r.Header.Get("X-Docuvate-Api-Key")
	if header == "" {
		auth := r.Header.Get("Authorization")
		if len(auth) > 7 && auth[:7] == "Bearer " {
			header = auth[7:]
		}
	}
	if header == "" || apiKey == "" {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(header), []byte(apiKey)) == 1
}

func decodeJSON(w http.ResponseWriter, r *http.Request, dest interface{}) error {
	limited := http.MaxBytesReader(w, r.Body, maxJSONBodyBytes)
	dec := json.NewDecoder(limited)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dest); err != nil {
		return err
	}
	if dec.More() {
		return io.ErrUnexpectedEOF
	}
	return nil
}

func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		return xff
	}
	host, _, _ := splitHostPort(r.RemoteAddr)
	return host
}

func splitHostPort(addr string) (string, string, error) {
	if addr == "" {
		return "", "", nil
	}
	for i := len(addr) - 1; i >= 0; i-- {
		if addr[i] == ':' {
			return addr[:i], addr[i+1:], nil
		}
	}
	return addr, "", nil
}

type ipRateLimiter struct {
	mu      sync.Mutex
	max     int
	window  time.Duration
	buckets map[string]struct {
		count int
		until time.Time
	}
}

func newIPRateLimiter(max int, window time.Duration) *ipRateLimiter {
	return &ipRateLimiter{max: max, window: window, buckets: map[string]struct {
		count int
		until time.Time
	}{}}
}

func (l *ipRateLimiter) allow(ip string) bool {
	now := time.Now()
	l.mu.Lock()
	defer l.mu.Unlock()
	b, ok := l.buckets[ip]
	if !ok || now.After(b.until) {
		l.buckets[ip] = struct {
			count int
			until time.Time
		}{count: 1, until: now.Add(l.window)}
		return true
	}
	if b.count >= l.max {
		return false
	}
	b.count++
	l.buckets[ip] = b
	return true
}
