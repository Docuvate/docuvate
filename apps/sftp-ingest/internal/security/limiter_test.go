package security

import (
	"testing"
	"time"
)

func TestLimiterLockoutAfterFailures(t *testing.T) {
	cfg := Config{MaxFailures: 3, LockoutBaseSeconds: 10, LockoutMaxSeconds: 60, IPAttemptsPerMinute: 100}
	l := NewLimiter(cfg)
	now := time.Now()
	user := "scan-demo"
	for i := 0; i < 2; i++ {
		if got := l.RecordLogin(user, false, now); got != OutcomeFailed {
			t.Fatalf("expected failed, got %v", got)
		}
	}
	if got := l.RecordLogin(user, false, now); got != OutcomeLocked {
		t.Fatalf("expected locked, got %v", got)
	}
	if !l.CheckAccount(user, now) {
		t.Fatal("account should be locked")
	}
}

func TestLimiterCheckAccountUnknownUser(t *testing.T) {
	l := NewLimiter(DefaultConfig())
	if l.CheckAccount("unknown-user", time.Now()) {
		t.Fatal("unknown user should not be locked")
	}
}

func TestLimiterIPWindow(t *testing.T) {
	cfg := Config{MaxFailures: 5, LockoutBaseSeconds: 10, LockoutMaxSeconds: 60, IPAttemptsPerMinute: 2}
	l := NewLimiter(cfg)
	now := time.Now()
	if !l.CheckIP("203.0.113.1", now) || !l.CheckIP("203.0.113.1", now) {
		t.Fatal("first attempts should pass")
	}
	if l.CheckIP("203.0.113.1", now) {
		t.Fatal("third attempt in window should fail")
	}
}
