package security

import "testing"

func TestResolveDialAddrRejectsPrivateWithoutAllowlist(t *testing.T) {
	_, err := ResolveDialAddr("127.0.0.1", 22, nil)
	if err == nil {
		t.Fatal("expected loopback to be rejected")
	}
}
