package security

import (
	"os"
	"testing"
)

func TestSafeUploadPathRejectsTraversal(t *testing.T) {
	_, err := SafeUploadPath("/data/staging/id1", "../../etc/passwd")
	if err != os.ErrPermission {
		t.Fatalf("expected permission error, got %v", err)
	}
}

func TestSafeUploadPathAllowsNested(t *testing.T) {
	path, err := SafeUploadPath("/data/staging/id1", "/inbox/scan.pdf")
	if err != nil {
		t.Fatal(err)
	}
	if !stringsHasSuffix(path, "inbox/scan.pdf") && !stringsHasSuffix(path, "inbox\\scan.pdf") {
		t.Fatalf("unexpected path %s", path)
	}
}

func stringsHasSuffix(s, suffix string) bool {
	return len(s) >= len(suffix) && s[len(s)-len(suffix):] == suffix
}
