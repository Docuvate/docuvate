package config

import (
	"os"
	"strings"
)

var knownWeakServiceKeys = map[string]bool{
	"local-sftp-ingest-service-key": true,
	"changeme":                      true,
	"test":                          true,
}

func LoadServiceAPIKey() (string, error) {
	if path := strings.TrimSpace(os.Getenv("DOCUVATE_SERVICE_API_KEY_FILE")); path != "" {
		raw, err := os.ReadFile(path)
		if err != nil {
			return "", err
		}
		key := strings.TrimSpace(string(raw))
		if key == "" {
			return "", errMissing("DOCUVATE_SERVICE_API_KEY_FILE empty")
		}
		if err := rejectWeakInProduction(key); err != nil {
			return "", err
		}
		return key, nil
	}
	key := strings.TrimSpace(os.Getenv("DOCUVATE_SERVICE_API_KEY"))
	if key == "" {
		return "", errMissing("DOCUVATE_SERVICE_API_KEY or DOCUVATE_SERVICE_API_KEY_FILE required")
	}
	if err := rejectWeakInProduction(key); err != nil {
		return "", err
	}
	return key, nil
}

func rejectWeakInProduction(key string) error {
	if os.Getenv("DOCUVATE_ENV") == "production" || os.Getenv("NODE_ENV") == "production" {
		if knownWeakServiceKeys[key] {
			return errMissing("refusing known placeholder service API key in production")
		}
	}
	return nil
}

type missingError string

func (m missingError) Error() string { return string(m) }

func errMissing(msg string) error { return missingError(msg) }
