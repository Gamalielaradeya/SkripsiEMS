package telegram

import (
	"strings"
	"testing"
)

func TestAlertMessageContainsOperationalContext(t *testing.T) {
	msg := alertMessage("waspada", "31.50", "2026-05-31T10:05:00Z", "2026-05-31T10:00:00Z")

	for _, expected := range []string{"waspada", "31.50°C", "S2 - Hotspot/Exhaust", "5 menit ke depan"} {
		if !strings.Contains(msg, expected) {
			t.Fatalf("expected message to contain %q", expected)
		}
	}
}
