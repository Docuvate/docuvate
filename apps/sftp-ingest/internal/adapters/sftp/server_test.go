package sftpadapter

import "testing"

func TestIsTemporaryName(t *testing.T) {
	if !isTemporaryName("upload.part") {
		t.Fatal("expected temporary")
	}
	if isTemporaryName("scan.pdf") {
		t.Fatal("expected final name")
	}
}
