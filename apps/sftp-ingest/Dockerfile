FROM golang:1.22.2-bookworm AS build
WORKDIR /src
COPY apps/sftp-ingest/go.mod apps/sftp-ingest/go.sum ./
RUN go mod download
COPY apps/sftp-ingest/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/sftp-ingest ./cmd/sftp-ingest

FROM alpine:3.20
RUN apk add --no-cache ca-certificates curl
WORKDIR /app
COPY --from=build /out/sftp-ingest /app/sftp-ingest
RUN adduser -D -u 65532 -g '' appuser && chown -R appuser:appuser /app
USER 65532:65532
EXPOSE 2222 8080
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD curl -sf http://127.0.0.1:8080/health || exit 1
ENTRYPOINT ["/app/sftp-ingest"]
