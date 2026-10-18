package security

import "testing"

func TestFingerprintNormalization(t *testing.T) {
	if !FingerprintsEqual("SHA256:YWJj", "YWJj") {
		t.Fatal("expected unpadded fingerprints to match")
	}
	if !FingerprintsEqual("SHA256:YWJj=", "YWJj") {
		t.Fatal("expected padded fingerprint to match unpadded")
	}
}
