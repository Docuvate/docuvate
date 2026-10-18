# SFTP scanner ingest

Docuvate supports scanner uploads in two ways:

1. **Built-in SFTP inbox** (`sftp-ingest` service): printers upload directly to Docuvate.
2. **SFTP fetch connector**: Docuvate pulls files from an existing SFTP server or NAS.

## Built-in SFTP inbox

### Data model (3NF)

- Account labels: junction table `sftp_ingress_account_labels` (no label id arrays on the account row).
- Ingest events: scoped by `account_id` only; owner user is resolved via the account (no duplicated `user_id`).
- Login audit: either `account_id` or `attempted_username`, never both (username is not stored when the account is known).
- Pull connector settings: encrypted blob on `connector_installations`; `sftp_pull_sync_state` holds only last-run metadata (no ingest job queue in JSON).

### Network

- Default port: **2222** (configure `SFTP_INGEST_PORT` / `DOCUVATE_SFTP_PUBLIC_PORT`).
- Open the port on your firewall or forward it to the Docuvate host.
- Protocol: **SFTP only** (no shell, no port forwarding).

### Credentials

Create an access under **Settings → Connections → Scanner inbox (SFTP)**.

Each access has a unique username, password (stored hashed on the server) and optional SSH public key. Passwords are shown once when the access is created.

### Host key

The `sftp-ingest` service generates or loads an Ed25519 host key in its data volume. The SHA-256 fingerprint is shown in the setup wizard (admins see it on the card as well) and at `GET http://<sftp-ingest>:8080/host-key`.

**Always verify the fingerprint on the printer** before saving the server profile. If the fingerprint changes unexpectedly, stop using the connection until your administrator confirms the server identity.

### Folder layout on the device

- Use remote path **`/`** (root of the access). Docuvate maps subfolders to your library when **Map subfolders** is enabled on the access.
- Scanners often create dated subfolders (for example `2026/04/08/`). That is fine when subfolder mapping is on.
- Temporary names (`.tmp`, `.part`, `~`) are ignored until the final file is closed or renamed.

### Processing

Files are ingested after the SFTP upload completes (close/rename) and size is stable.

Allowed types: PDF, JPEG, PNG, TIFF. Maximum size matches the Docuvate web upload limit (25 MiB by default). Duplicates use the normal Docuvate dedup pipeline.

In the library, documents from this channel show the source **Scanner inbox** / **Scanner-Eingang**.

### Service API

The Go service calls `/v1/sftp-ingress/service/*` with a service API key that includes the `sftp_ingress:service` claim (`DOCUVATE_SERVICE_API_KEYS`).

Audit events (login success, failure, lockout) are recorded as `sftp.login_ok`, `sftp.login_failed`, and `sftp.login_locked`.

## Device setup examples

Use **SFTP** (not FTP or FTPS unless the device explicitly supports SFTP). Enter the server address and port from Docuvate, path `/`, and the username/password or SSH key from the access.

| Vendor | Where to configure | Notes |
| --- | --- | --- |
| **Brother** | Scan to FTP/SFTP (model-dependent) | Choose SFTP, disable passive FTP. Verify host key fingerprint when prompted. |
| **HP** | Embedded Web Server → Scan / Digital Sending → SFTP | Some models label this “Send to Network Folder (SFTP)”. Use port 2222 if that is your public port. |
| **Canon** | imageRUNNER / SEND → Address Book → File | Protocol SFTP. Store fingerprint after first connection test. |
| **Epson** | Document Capture Pro / printer panel → Scan to Server (SFTP) | Path `/`, no chroot prefix unless your admin documented one. |
| **Generic** | “Scan to server”, “Network folder”, or “SFTP storage” | Server = Docuvate host, port = published SFTP port, authentication = password or public key. |

If the device cannot show a fingerprint, use a one-time test from a trusted PC with `ssh-keygen -lf` against the same host and port, or ask your administrator for the fingerprint from the Connections page.

## SFTP fetch connector

Configure **Fetch from SFTP server** under Connections.

- **Host key pinning** is required: run connection test, confirm the SHA-256 fingerprint, then save.
- Set poll interval and whether imported files are deleted or moved to a subfolder.

Pull operations run through the Go `sftp-ingest` gateway (no native `ssh2` build in the API).

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Login fails | Access revoked? Username/password correct? Too many attempts (temporary lockout)? |
| Upload rejected in UI | File type, size limit (`DOCUVATE_SFTP_INGEST_MAX_BYTES`), or empty file |
| Fingerprint missing in UI | Set `DOCUVATE_SFTP_HOST_KEY_FINGERPRINT` or ensure `sftp-ingest` is running |
| Ingest never runs | API reachable from `sftp-ingest`, service key claim present |

## Kubernetes

When cluster manifests are available, expose Service port 2222 for `sftp-ingest` and mount a persistent volume for `/data` (host key and staging).
