package security

import (
	"crypto/sha256"
	"encoding/base64"
	"strings"

	gossh "golang.org/x/crypto/ssh"
)

func FingerprintSHA256(key gossh.PublicKey) string {
	sum := sha256.Sum256(key.Marshal())
	return "SHA256:" + base64.RawStdEncoding.EncodeToString(sum[:])
}

func NormalizeFingerprint(raw string) string {
	s := strings.TrimSpace(raw)
	s = strings.TrimPrefix(s, "SHA256:")
	s = strings.Trim(s, "=")
	return s
}

func FingerprintsEqual(a, b string) bool {
	return NormalizeFingerprint(a) == NormalizeFingerprint(b)
}
