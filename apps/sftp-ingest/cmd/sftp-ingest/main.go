package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	httpadapter "github.com/docuvate/sftp-ingest/internal/adapters/http"
	sftpadapter "github.com/docuvate/sftp-ingest/internal/adapters/sftp"
	"github.com/docuvate/sftp-ingest/internal/security"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	apiURL := env("DOCUVATE_API_URL", "http://api:3001")
	apiKey := os.Getenv("DOCUVATE_SERVICE_API_KEY")
	if apiKey == "" {
		logger.Error("DOCUVATE_SERVICE_API_KEY is required")
		os.Exit(1)
	}
	client := httpadapter.NewClient(apiURL, apiKey)
	cfg := sftpadapter.Config{
		ListenAddr:                env("SFTP_LISTEN_ADDR", ":2222"),
		HostKeyPath:               env("SFTP_HOST_KEY_PATH", "/data/host_key"),
		DataDir:                   env("SFTP_DATA_DIR", "/data/staging"),
		MaxFileBytes:              envInt64("DOCUVATE_SFTP_INGEST_MAX_BYTES", 26_214_400),
		MaxPendingBytesPerAccount: envInt64("DOCUVATE_SFTP_MAX_PENDING_BYTES", 104_857_600),
		Limiter:                   security.NewLimiter(security.DefaultConfig()),
	}
	server, err := sftpadapter.NewServer(cfg, client, client, client, logger)
	if err != nil {
		logger.Error("server init failed", "err", err)
		os.Exit(1)
	}
	go startHealthServer(ctx, logger, server, apiKey, env("SFTP_HEALTH_ADDR", ":8080"))
	logger.Info("starting sftp ingest", "addr", cfg.ListenAddr)
	if err := server.ListenAndServe(ctx); err != nil {
		logger.Error("sftp server stopped", "err", err)
		os.Exit(1)
	}
}

func startHealthServer(ctx context.Context, logger *slog.Logger, server *sftpadapter.Server, apiKey, addr string) {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})
	mux.HandleFunc("/health/ready", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ready"))
	})
	mux.HandleFunc("/host-key", func(w http.ResponseWriter, _ *http.Request) {
		fp := server.HostKeyFingerprint()
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"hostKeyFingerprintSha256":"` + fp.FingerprintSHA256 + `"}`))
	})
	mux.HandleFunc("/pull/probe", httpadapter.PullProbeHandler(apiKey))
	mux.HandleFunc("/pull/list", httpadapter.PullListHandler(apiKey))
	mux.HandleFunc("/pull/fetch", httpadapter.PullFetchHandler(apiKey))
	mux.HandleFunc("/pull/post-process", httpadapter.PullPostProcessHandler(apiKey))
	httpServer := &http.Server{Addr: addr, Handler: mux, ReadHeaderTimeout: 5 * time.Second}
	go func() {
		<-ctx.Done()
		_ = httpServer.Shutdown(context.Background())
	}()
	if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.Error("health server failed", "err", err)
	}
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func envInt64(key string, fallback int64) int64 {
	raw := os.Getenv(key)
	if raw == "" {
		return fallback
	}
	parsed, err := strconv.ParseInt(raw, 10, 64)
	if err != nil {
		return fallback
	}
	return parsed
}
