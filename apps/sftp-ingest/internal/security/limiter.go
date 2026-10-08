package security

import (
	"sync"
	"time"
)

type LoginOutcome int

const (
	OutcomeOK LoginOutcome = iota
	OutcomeFailed
	OutcomeLocked
)

type Config struct {
	MaxFailures         int
	LockoutBaseSeconds  int
	LockoutMaxSeconds   int
	IPAttemptsPerMinute int
}

func DefaultConfig() Config {
	return Config{
		MaxFailures:         5,
		LockoutBaseSeconds:  30,
		LockoutMaxSeconds:   900,
		IPAttemptsPerMinute: 30,
	}
}

type bucket struct {
	count     int
	windowEnd time.Time
}

type accountState struct {
	failures    int
	lockedUntil time.Time
}

type Limiter struct {
	cfg       Config
	mu        sync.Mutex
	ipBuckets map[string]*bucket
	accounts  map[string]*accountState
}

func NewLimiter(cfg Config) *Limiter {
	return &Limiter{
		cfg:       cfg,
		accounts:  map[string]*accountState{},
		ipBuckets: map[string]*bucket{},
	}
}

func (l *Limiter) CheckIP(ip string, now time.Time) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	b := l.ipBuckets[ip]
	if b == nil || now.After(b.windowEnd) {
		l.ipBuckets[ip] = &bucket{count: 1, windowEnd: now.Add(time.Minute)}
		return true
	}
	if b.count >= l.cfg.IPAttemptsPerMinute {
		return false
	}
	b.count++
	return true
}

func (l *Limiter) CheckAccount(username string, now time.Time) (locked bool) {
	l.mu.Lock()
	defer l.mu.Unlock()
	st := l.accounts[username]
	if st != nil && !st.lockedUntil.IsZero() && now.Before(st.lockedUntil) {
		return true
	}
	if st != nil && !st.lockedUntil.IsZero() {
		st.failures = 0
		st.lockedUntil = time.Time{}
	}
	return false
}

func (l *Limiter) RecordLogin(username string, ok bool, now time.Time) LoginOutcome {
	l.mu.Lock()
	defer l.mu.Unlock()
	st := l.accounts[username]
	if st == nil {
		st = &accountState{}
		l.accounts[username] = st
	}
	if !st.lockedUntil.IsZero() && now.Before(st.lockedUntil) {
		return OutcomeLocked
	}
	if ok {
		st.failures = 0
		st.lockedUntil = time.Time{}
		return OutcomeOK
	}
	st.failures++
	if st.failures < l.cfg.MaxFailures {
		return OutcomeFailed
	}
	shift := st.failures - l.cfg.MaxFailures
	if shift > 10 {
		shift = 10
	}
	backoff := l.cfg.LockoutBaseSeconds << shift
	if backoff > l.cfg.LockoutMaxSeconds {
		backoff = l.cfg.LockoutMaxSeconds
	}
	st.lockedUntil = now.Add(time.Duration(backoff) * time.Second)
	return OutcomeLocked
}
