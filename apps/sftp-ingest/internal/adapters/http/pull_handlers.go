package httpadapter

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/docuvate/sftp-ingest/internal/adapters/pull"
)

type pullProbeRequest struct {
	Host       string `json:"host"`
	Port       int    `json:"port"`
	Username   string `json:"username"`
	Password   string `json:"password"`
	PrivateKey string `json:"privateKey"`
}

func PullProbeHandler(apiKey string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !authorized(r, apiKey) {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		var body pullProbeRequest
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}
		fp, err := pull.ProbeHostKey(pull.Config{
			Host: body.Host, Port: body.Port, Username: body.Username,
			Password: body.Password, PrivateKeyPEM: body.PrivateKey, RemotePath: "/",
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
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
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
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
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
	Ref          string `json:"ref"`
	AfterImport  string `json:"afterImport"`
	ArchivePath  string `json:"archivePath"`
	Filename     string `json:"filename"`
}

func PullPostProcessHandler(apiKey string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !authorized(r, apiKey) {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		var body pullPostProcessRequest
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
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
	return header != "" && header == apiKey
}
