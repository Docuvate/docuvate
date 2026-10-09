package security

import (
	"fmt"
	"net"
	"os"
	"strings"
	"time"

	gossh "golang.org/x/crypto/ssh"
)

func ParseAllowlist() []string {
	raw := os.Getenv("DOCUVATE_SFTP_PULL_HOST_ALLOWLIST")
	if raw == "" {
		return nil
	}
	var out []string
	for _, part := range strings.Split(raw, ",") {
		p := strings.TrimSpace(part)
		if p != "" {
			out = append(out, strings.ToLower(p))
		}
	}
	return out
}

func hostAllowedByName(host string, allowlist []string) bool {
	h := strings.ToLower(strings.TrimSpace(host))
	for _, a := range allowlist {
		if h == a || strings.HasSuffix(h, "."+a) {
			return true
		}
	}
	return false
}

func isBlockedIP(ip net.IP) bool {
	if ip == nil {
		return true
	}
	if ip.IsLoopback() || ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() || ip.IsPrivate() {
		return true
	}
	if ip.IsMulticast() {
		return true
	}
	// Unique local IPv6 (fc00::/7)
	if len(ip) == net.IPv6len && ip[0]&0xfe == 0xfc {
		return true
	}
	return false
}

func ResolveDialAddr(host string, port int, allowlist []string) (string, error) {
	host = strings.TrimSpace(host)
	if host == "" {
		return "", fmt.Errorf("host required")
	}
	if port <= 0 || port > 65535 {
		return "", fmt.Errorf("invalid port")
	}
	allowedName := hostAllowedByName(host, allowlist)
	ips, err := net.LookupIP(host)
	if err != nil {
		return "", err
	}
	if len(ips) == 0 {
		return "", fmt.Errorf("host unresolved")
	}
	for _, ip := range ips {
		if isBlockedIP(ip) && !allowedName {
			return "", fmt.Errorf("host not allowed")
		}
	}
	return fmt.Sprintf("%s:%d", ips[0].String(), port), nil
}

func DialSSH(addr string, config *gossh.ClientConfig) (*gossh.Client, error) {
	dialer := &net.Dialer{Timeout: 20 * time.Second}
	conn, err := dialer.Dial("tcp", addr)
	if err != nil {
		return nil, err
	}
	cc, chans, reqs, err := gossh.NewClientConn(conn, addr, config)
	if err != nil {
		_ = conn.Close()
		return nil, err
	}
	return gossh.NewClient(cc, chans, reqs), nil
}
