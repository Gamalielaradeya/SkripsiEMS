package handler

import (
	"math"
	"strings"
	"testing"
	"time"

	"github.com/ems-thermal/backend-go/internal/model"
)

func validGatewayReading() model.GatewayReadingRequest {
	return model.GatewayReadingRequest{
		GatewayID:  "raspi-gateway-01",
		RecordedAt: time.Now(),
		Source:     "hardware",
		Readings: []model.SensorReadingItem{
			{SensorCode: "S1", Temperature: 25.5, Humidity: 65.0, QualityStatus: "valid"},
			{SensorCode: "S2", Temperature: 28.0, Humidity: 58.0, QualityStatus: "valid"},
		},
	}
}

func TestValidateGatewayReadingAcceptsValidPayload(t *testing.T) {
	if err := validateGatewayReading(validGatewayReading()); err != nil {
		t.Fatalf("expected valid payload, got %v", err)
	}
}

func TestValidateGatewayReadingAcceptsTroubleWithoutNumericValues(t *testing.T) {
	req := validGatewayReading()
	req.Readings[0] = model.SensorReadingItem{
		SensorCode:    "S1",
		Temperature:   -1,
		Humidity:      -1,
		QualityStatus: "timeout",
	}
	if err := validateGatewayReading(req); err != nil {
		t.Fatalf("expected trouble payload, got %v", err)
	}
}

func TestValidateGatewayReadingRejectsMissingTimestamp(t *testing.T) {
	req := validGatewayReading()
	req.RecordedAt = time.Time{}
	if err := validateGatewayReading(req); err == nil || !strings.Contains(err.Error(), "recorded_at") {
		t.Fatalf("expected recorded_at error, got %v", err)
	}
}

func TestValidateGatewayReadingRejectsOutOfRangeValues(t *testing.T) {
	req := validGatewayReading()
	req.Readings[0].Temperature = 81
	if err := validateGatewayReading(req); err == nil || !strings.Contains(err.Error(), "temperature") {
		t.Fatalf("expected temperature error, got %v", err)
	}
}

func TestValidateGatewayReadingRejectsNonFiniteValues(t *testing.T) {
	req := validGatewayReading()
	req.Readings[0].Humidity = math.NaN()
	if err := validateGatewayReading(req); err == nil || !strings.Contains(err.Error(), "humidity") {
		t.Fatalf("expected humidity error, got %v", err)
	}
}

func TestStoredQuality(t *testing.T) {
	if got := storedQuality("simulator", "valid"); got != "simulated" {
		t.Fatalf("expected simulated, got %q", got)
	}
	if got := storedQuality("hardware", "valid"); got != "valid" {
		t.Fatalf("expected valid, got %q", got)
	}
}

func TestShouldNotifyThermalStatus(t *testing.T) {
	if shouldNotifyThermalStatus("normal") {
		t.Fatal("normal status must not send Telegram alert")
	}
	if !shouldNotifyThermalStatus("waspada") {
		t.Fatal("waspada status must send Telegram alert")
	}
	if !shouldNotifyThermalStatus("anomali") {
		t.Fatal("anomali status must send Telegram alert")
	}
}

func TestClassifyPredictedThermalStatusBoundaries(t *testing.T) {
	if got := classifyPredictedThermalStatus(29.99, 30, 32); got != "normal" {
		t.Fatalf("expected normal, got %q", got)
	}
	if got := classifyPredictedThermalStatus(30, 30, 32); got != "waspada" {
		t.Fatalf("expected waspada, got %q", got)
	}
	if got := classifyPredictedThermalStatus(32.01, 30, 32); got != "anomali" {
		t.Fatalf("expected anomali, got %q", got)
	}
}

func TestSettingFloatUsesFallbackForMissingOrInvalidValues(t *testing.T) {
	missing := func(string) (string, error) { return "", assertError{} }
	invalid := func(string) (string, error) { return "not-a-number", nil }
	if got := settingFloat(missing, "key", 30); got != 30 {
		t.Fatalf("expected fallback 30, got %v", got)
	}
	if got := settingFloat(invalid, "key", 32); got != 32 {
		t.Fatalf("expected fallback 32, got %v", got)
	}
}

func TestFreshness(t *testing.T) {
	now := time.Now()
	recent := now.Add(-30 * time.Second)
	old := now.Add(-3 * time.Minute)
	if !isFresh(&recent, 2*time.Minute, now) {
		t.Fatal("recent timestamp must be fresh")
	}
	if isFresh(&old, 2*time.Minute, now) {
		t.Fatal("old timestamp must be stale")
	}
	if isFresh(nil, 2*time.Minute, now) {
		t.Fatal("nil timestamp must be stale")
	}
}

func TestValidLayoutPosition(t *testing.T) {
	if !validLayoutPosition(0, 100) {
		t.Fatal("boundary positions must be accepted")
	}
	if validLayoutPosition(-1, 50) || validLayoutPosition(50, 101) {
		t.Fatal("out-of-range positions must be rejected")
	}
	if validLayoutPosition(math.NaN(), 50) {
		t.Fatal("non-finite positions must be rejected")
	}
}

type assertError struct{}

func (assertError) Error() string { return "test error" }
