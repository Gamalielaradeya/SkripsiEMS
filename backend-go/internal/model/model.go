package model

import (
	"encoding/json"
	"time"
)

// Gateway represents a Raspberry Pi or simulator gateway
type Gateway struct {
	ID          int64      `json:"id"`
	GatewayCode string     `json:"gateway_code"`
	Name        string     `json:"name"`
	Location    string     `json:"location"`
	Description string     `json:"description"`
	IPAddress   *string    `json:"ip_address"`
	Status      string     `json:"status"`
	LastSeenAt  *time.Time `json:"last_seen_at"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// Sensor represents XY-MD02 sensor S1 or S2
type Sensor struct {
	ID            int64      `json:"id"`
	GatewayID     *int64     `json:"gateway_id"`
	SensorCode    string     `json:"sensor_code"`
	SensorRole    string     `json:"sensor_role"`
	Name          string     `json:"name"`
	Type          string     `json:"type"`
	Location      string     `json:"location"`
	ModbusSlaveID *int       `json:"modbus_slave_id"`
	Status        string     `json:"status"`
	LastSeenAt    *time.Time `json:"last_seen_at"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

// SensorReading represents one time-series data point
type SensorReading struct {
	ID            int64           `json:"id"`
	GatewayID     int64           `json:"gateway_id"`
	SensorID      int64           `json:"sensor_id"`
	Temperature   float64         `json:"temperature"`
	Humidity      float64         `json:"humidity"`
	RecordedAt    time.Time       `json:"recorded_at"`
	QualityStatus string          `json:"quality_status"`
	RawPayload    json.RawMessage `json:"raw_payload,omitempty"`
	CreatedAt     time.Time       `json:"created_at"`
}

// ModelVersion represents a trained LSTM model
type ModelVersion struct {
	ID                       int64           `json:"id"`
	ModelName                string          `json:"model_name"`
	ModelType                string          `json:"model_type"`
	Version                  string          `json:"version"`
	Algorithm                string          `json:"algorithm"`
	FeatureColumns           json.RawMessage `json:"feature_columns"`
	TargetColumn             string          `json:"target_column"`
	WindowSize               int             `json:"window_size"`
	HorizonMinutes           int             `json:"horizon_minutes"`
	SamplingIntervalSeconds  int             `json:"sampling_interval_seconds"`
	ModelPath                *string         `json:"model_path"`
	ScalerPath               *string         `json:"scaler_path"`
	Parameters               json.RawMessage `json:"parameters,omitempty"`
	TrainedAt                *time.Time      `json:"trained_at"`
	CreatedAt                time.Time       `json:"created_at"`
}

// Prediction represents one LSTM prediction result
type Prediction struct {
	ID                       int64      `json:"id"`
	PredictionRunID          *int64     `json:"prediction_run_id"`
	ModelVersionID           int64      `json:"model_version_id"`
	TargetSensorID           int64      `json:"target_sensor_id"`
	PredictedTemperature     float64    `json:"predicted_temperature"`
	PredictionHorizonMinutes int        `json:"prediction_horizon_minutes"`
	InputWindowSize          int        `json:"input_window_size"`
	InputStartAt             *time.Time `json:"input_start_at"`
	InputEndAt               *time.Time `json:"input_end_at"`
	PredictedFor             time.Time  `json:"predicted_for"`
	CreatedAt                time.Time  `json:"created_at"`
}

// AnomalyEvent represents a thermal status classification result
type AnomalyEvent struct {
	ID                   int64      `json:"id"`
	PredictionID         int64      `json:"prediction_id"`
	SensorID             int64      `json:"sensor_id"`
	Status               string     `json:"status"`
	PredictedTemperature float64    `json:"predicted_temperature"`
	ActualTemperature    *float64   `json:"actual_temperature"`
	ThresholdNormalMax   float64    `json:"threshold_normal_max"`
	ThresholdAnomalyMin  float64    `json:"threshold_anomaly_min"`
	Description          string     `json:"description"`
	DetectedAt           time.Time  `json:"detected_at"`
	CreatedAt            time.Time  `json:"created_at"`
}

// ModelMetrics represents evaluation results
type ModelMetrics struct {
	ID              int64      `json:"id"`
	ModelVersionID  int64      `json:"model_version_id"`
	DatasetStartAt  *time.Time `json:"dataset_start_at"`
	DatasetEndAt    *time.Time `json:"dataset_end_at"`
	TrainSize       *int       `json:"train_size"`
	TestSize        *int       `json:"test_size"`
	RMSE            float64    `json:"rmse"`
	MAE             float64    `json:"mae"`
	MAPE            float64    `json:"mape"`
	CreatedAt       time.Time  `json:"created_at"`
}

// BaselineResult represents persistence/moving_average baseline result
type BaselineResult struct {
	ID              int64      `json:"id"`
	ModelVersionID  *int64     `json:"model_version_id"`
	BaselineType    string     `json:"baseline_type"`
	DatasetStartAt  *time.Time `json:"dataset_start_at"`
	DatasetEndAt    *time.Time `json:"dataset_end_at"`
	RMSE            float64    `json:"rmse"`
	MAE             float64    `json:"mae"`
	MAPE            float64    `json:"mape"`
	CreatedAt       time.Time  `json:"created_at"`
}

// NotificationLog represents a Telegram notification attempt
type NotificationLog struct {
	ID             int64      `json:"id"`
	AnomalyEventID *int64     `json:"anomaly_event_id"`
	Channel        string     `json:"channel"`
	Recipient      *string    `json:"recipient"`
	Message        string     `json:"message"`
	Status         string     `json:"status"`
	SentAt         *time.Time `json:"sent_at"`
	ErrorMessage   *string    `json:"error_message"`
	CreatedAt      time.Time  `json:"created_at"`
}

// Setting represents a configurable system parameter
type Setting struct {
	ID          int64     `json:"id"`
	Key         string    `json:"key"`
	Value       string    `json:"value"`
	Description string    `json:"description"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// SystemLog represents a system event log
type SystemLog struct {
	ID        int64           `json:"id"`
	Source    string          `json:"source"`
	Level     string          `json:"level"`
	Message   string          `json:"message"`
	Metadata  json.RawMessage `json:"metadata,omitempty"`
	CreatedAt time.Time       `json:"created_at"`
}

// Layout represents a sensor layout image
type Layout struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	ImagePath   *string   `json:"image_path"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// LayoutDevice represents sensor position in a layout
type LayoutDevice struct {
	ID           int64     `json:"id"`
	LayoutID     int64     `json:"layout_id"`
	SensorID     int64     `json:"sensor_id"`
	StatusIconID *int64    `json:"status_icon_id"`
	PosX         float64   `json:"pos_x"`
	PosY         float64   `json:"pos_y"`
	Label        string    `json:"label"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// StatusIcon represents icon for a thermal status
type StatusIcon struct {
	ID          int64     `json:"id"`
	Status      string    `json:"status"`
	IconPath    string    `json:"icon_path"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

// ─── Request/Response DTOs ─────────────────────────────────────────────────

// GatewayReadingRequest is what the gateway POSTs
type GatewayReadingRequest struct {
	GatewayID  string           `json:"gateway_id"`
	RecordedAt time.Time        `json:"recorded_at"`
	Source     string           `json:"source"`
	Readings   []SensorReadingItem `json:"readings"`
}

type SensorReadingItem struct {
	SensorCode  string  `json:"sensor_code"`
	SensorRole  string  `json:"sensor_role"`
	Temperature float64 `json:"temperature"`
	Humidity    float64 `json:"humidity"`
}

// GatewayStatusRequest is what the gateway POSTs for status update
type GatewayStatusRequest struct {
	GatewayID string `json:"gateway_id"`
	Status    string `json:"status"`
	IPAddress string `json:"ip_address,omitempty"`
}

// DashboardSummary is the main dashboard response
type DashboardSummary struct {
	S1Latest        *LatestSensorData `json:"s1_latest"`
	S2Latest        *LatestSensorData `json:"s2_latest"`
	LatestPrediction *Prediction      `json:"latest_prediction"`
	ThermalStatus   string            `json:"thermal_status"`
	GatewayStatus   string            `json:"gateway_status"`
	LastUpdatedAt   *time.Time        `json:"last_updated_at"`
}

type LatestSensorData struct {
	SensorCode  string    `json:"sensor_code"`
	SensorRole  string    `json:"sensor_role"`
	Temperature float64   `json:"temperature"`
	Humidity    float64   `json:"humidity"`
	RecordedAt  time.Time `json:"recorded_at"`
	Status      string    `json:"status"`
}

// SSE Event
type SSEEvent struct {
	Event string      `json:"event"`
	Data  interface{} `json:"data"`
}
