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

const maxLimiterEntries = 10_000

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
	lockouts    int
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

func (l *Limiter) pruneIfNeeded() {
	if len(l.accounts) <= maxLimiterEntries {
		return
	}
	for k := range l.accounts {
		delete(l.accounts, k)
		if len(l.accounts) <= maxLimiterEntries/2 {
			break
		}
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
	username = NormalizeUsername(username)
	l.mu.Lock()
	defer l.mu.Unlock()
	st := l.accounts[username]
	if st != nil && !st.lockedUntil.IsZero() && now.Before(st.lockedUntil) {
		return true
	}
	if st != nil && !st.lockedUntil.IsZero() && !now.Before(st.lockedUntil) {
		st.lockedUntil = time.Time{}
	}
	return false
}

func (l *Limiter) RecordLogin(username string, ok bool, now time.Time) LoginOutcome {
	username = NormalizeUsername(username)
	l.mu.Lock()
	defer l.mu.Unlock()
	st := l.accounts[username]
	if st == nil {
		st = &accountState{}
		l.accounts[username] = st
	}
	l.pruneIfNeeded()
	if !st.lockedUntil.IsZero() && now.Before(st.lockedUntil) {
		return OutcomeLocked
	}
	if ok {
		st.failures = 0
		st.lockouts = 0
		st.lockedUntil = time.Time{}
		return OutcomeOK
	}
	st.failures++
	if st.failures < l.cfg.MaxFailures {
		return OutcomeFailed
	}
	st.lockouts++
	shift := st.lockouts
	if shift > 10 {
		shift = 10
	}
	backoff := l.cfg.LockoutBaseSeconds << (shift - 1)
	if backoff < l.cfg.LockoutBaseSeconds {
		backoff = l.cfg.LockoutBaseSeconds
	}
	if backoff > l.cfg.LockoutMaxSeconds {
		backoff = l.cfg.LockoutMaxSeconds
	}
	st.lockedUntil = now.Add(time.Duration(backoff) * time.Second)
	return OutcomeLocked
}
