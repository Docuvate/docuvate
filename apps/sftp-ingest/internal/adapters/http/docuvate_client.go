package httpadapter

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"

	"github.com/docuvate/sftp-ingest/internal/ports"
)

type Client struct {
	baseURL string
	apiKey  string
	http    *http.Client
}

func NewClient(baseURL, apiKey string) *Client {
	return &Client{
		baseURL: baseURL,
		apiKey:  apiKey,
		http:    &http.Client{Timeout: 120 * time.Second},
	}
}

func (c *Client) Authenticate(ctx context.Context, req ports.AuthRequest) (ports.AuthResult, error) {
	body, _ := json.Marshal(map[string]string{
		"username":  req.Username,
		"password":  req.Password,
		"publicKey": req.PublicKey,
	})
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/v1/sftp-ingress/service/authenticate", bytes.NewReader(body))
	if err != nil {
		return ports.AuthResult{}, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("X-Docuvate-Api-Key", c.apiKey)
	resp, err := c.http.Do(httpReq)
	if err != nil {
		return ports.AuthResult{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return ports.AuthResult{}, fmt.Errorf("auth failed: %s", resp.Status)
	}
	var parsed struct {
		AccountID string `json:"accountId"`
		UserID    string `json:"userId"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return ports.AuthResult{}, err
	}
	return ports.AuthResult{AccountID: parsed.AccountID, UserID: parsed.UserID}, nil
}

func (c *Client) ResolveByUsername(ctx context.Context, username string) (ports.AuthResult, error) {
	body, _ := json.Marshal(map[string]string{"username": username})
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/v1/sftp-ingress/service/resolve", bytes.NewReader(body))
	if err != nil {
		return ports.AuthResult{}, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("X-Docuvate-Api-Key", c.apiKey)
	resp, err := c.http.Do(httpReq)
	if err != nil {
		return ports.AuthResult{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return ports.AuthResult{}, fmt.Errorf("resolve failed: %s", resp.Status)
	}
	var parsed struct {
		AccountID string `json:"accountId"`
		UserID    string `json:"userId"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return ports.AuthResult{}, err
	}
	return ports.AuthResult{AccountID: parsed.AccountID, UserID: parsed.UserID}, nil
}

func (c *Client) Record(ctx context.Context, event ports.AuditEvent) error {
	body, _ := json.Marshal(event)
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/v1/sftp-ingress/service/audit", bytes.NewReader(body))
	if err != nil {
		return err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("X-Docuvate-Api-Key", c.apiKey)
	resp, err := c.http.Do(httpReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("audit failed: %s", resp.Status)
	}
	return nil
}

func (c *Client) Ingest(ctx context.Context, req ports.IngestRequest) (ports.IngestResult, error) {
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)
	_ = writer.WriteField("accountId", req.AccountID)
	_ = writer.WriteField("remotePath", req.RemotePath)
	part, err := writer.CreateFormFile("file", req.Filename)
	if err != nil {
		return ports.IngestResult{}, err
	}
	if _, err := part.Write(req.Content); err != nil {
		return ports.IngestResult{}, err
	}
	writer.Close()

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/v1/sftp-ingress/service/ingest", &buf)
	if err != nil {
		return ports.IngestResult{}, err
	}
	httpReq.Header.Set("Content-Type", writer.FormDataContentType())
	httpReq.Header.Set("X-Docuvate-Api-Key", c.apiKey)
	resp, err := c.http.Do(httpReq)
	if err != nil {
		return ports.IngestResult{}, err
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 300 {
		return ports.IngestResult{Rejected: true, ReasonKey: "sftpIngress.errors.processingFailed"}, nil
	}
	var parsed struct {
		DocumentID *string `json:"documentId"`
		Event      struct {
			Status    string  `json:"status"`
			ReasonKey *string `json:"reasonKey"`
		} `json:"event"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return ports.IngestResult{}, err
	}
	result := ports.IngestResult{DocumentID: parsed.DocumentID}
	if parsed.Event.Status == "rejected" {
		result.Rejected = true
		if parsed.Event.ReasonKey != nil {
			result.ReasonKey = *parsed.Event.ReasonKey
		}
	}
	return result, nil
}
