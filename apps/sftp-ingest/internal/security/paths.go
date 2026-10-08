package security

import (
	"os"
	"path/filepath"
	"strings"
)

func SafeUploadPath(root, reqPath string) (string, error) {
	if strings.Contains(reqPath, "\x00") {
		return "", os.ErrPermission
	}
	slash := strings.ReplaceAll(reqPath, "\\", "/")
	for _, part := range strings.Split(slash, "/") {
		if part == ".." {
			return "", os.ErrPermission
		}
	}
	rel := strings.TrimPrefix(filepath.Clean("/"+slash), "/")
	if rel == ".." || strings.HasPrefix(rel, "../") {
		return "", os.ErrPermission
	}
	joined := filepath.Join(root, rel)
	absRoot, err := filepath.Abs(root)
	if err != nil {
		return "", err
	}
	absJoined, err := filepath.Abs(joined)
	if err != nil {
		return "", err
	}
	if absJoined != absRoot && !strings.HasPrefix(absJoined, absRoot+string(os.PathSeparator)) {
		return "", os.ErrPermission
	}
	return absJoined, nil
}
