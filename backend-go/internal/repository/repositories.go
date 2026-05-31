package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/ems-thermal/backend-go/internal/model"
	"github.com/jackc/pgx/v5/pgxpool"
)

type GatewayRepository struct {
	db *pgxpool.Pool
}

func NewGatewayRepository(db *pgxpool.Pool) *GatewayRepository {
	return &GatewayRepository{db: db}
}

func (r *GatewayRepository) FindByCode(ctx context.Context, code string) (*model.Gateway, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, gateway_code, name, location, status, last_seen_at, created_at, updated_at
		FROM gateways WHERE gateway_code = $1
	`, code)
	var g model.Gateway
	err := row.Scan(&g.ID, &g.GatewayCode, &g.Name, &g.Location, &g.Status, &g.LastSeenAt, &g.CreatedAt, &g.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("gateway not found: %w", err)
	}
	return &g, nil
}

func (r *GatewayRepository) UpdateLastSeen(ctx context.Context, gatewayID int64) error {
	_, err := r.db.Exec(ctx, `
		UPDATE gateways SET status = 'active', last_seen_at = $1, updated_at = $1 WHERE id = $2
	`, time.Now(), gatewayID)
	return err
}

func (r *GatewayRepository) GetLatest(ctx context.Context) (*model.Gateway, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, gateway_code, name, location, status, last_seen_at, created_at, updated_at
		FROM gateways
		ORDER BY updated_at DESC
		LIMIT 1
	`)
	var g model.Gateway
	err := row.Scan(&g.ID, &g.GatewayCode, &g.Name, &g.Location, &g.Status, &g.LastSeenAt, &g.CreatedAt, &g.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &g, nil
}

type SensorRepository struct {
	db *pgxpool.Pool
}

func NewSensorRepository(db *pgxpool.Pool) *SensorRepository {
	return &SensorRepository{db: db}
}

func (r *SensorRepository) FindByCode(ctx context.Context, gatewayID int64, code string) (*model.Sensor, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, gateway_id, sensor_code, sensor_role, name, type, location, status, last_seen_at, created_at, updated_at
		FROM sensors WHERE gateway_id = $1 AND sensor_code = $2
	`, gatewayID, code)
	var s model.Sensor
	err := row.Scan(&s.ID, &s.GatewayID, &s.SensorCode, &s.SensorRole, &s.Name, &s.Type, &s.Location, &s.Status, &s.LastSeenAt, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("sensor %s not found: %w", code, err)
	}
	return &s, nil
}

func (r *SensorRepository) UpdateLastSeen(ctx context.Context, sensorID int64) error {
	_, err := r.db.Exec(ctx, `
		UPDATE sensors SET status = 'normal', last_seen_at = $1, updated_at = $1 WHERE id = $2
	`, time.Now(), sensorID)
	return err
}

func (r *SensorRepository) UpdateStatus(ctx context.Context, sensorID int64, status string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE sensors SET status = $1, last_seen_at = $2, updated_at = $2 WHERE id = $3
	`, status, time.Now(), sensorID)
	return err
}

func (r *SensorRepository) ListAll(ctx context.Context) ([]model.Sensor, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, gateway_id, sensor_code, sensor_role, name, type, location, status, last_seen_at, created_at, updated_at
		FROM sensors ORDER BY sensor_code
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var sensors []model.Sensor
	for rows.Next() {
		var s model.Sensor
		if err := rows.Scan(&s.ID, &s.GatewayID, &s.SensorCode, &s.SensorRole, &s.Name, &s.Type, &s.Location, &s.Status, &s.LastSeenAt, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		sensors = append(sensors, s)
	}
	return sensors, nil
}

type PredictionRepository struct {
	db *pgxpool.Pool
}

func NewPredictionRepository(db *pgxpool.Pool) *PredictionRepository {
	return &PredictionRepository{db: db}
}

func (r *PredictionRepository) GetLatest(ctx context.Context) (*model.Prediction, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, prediction_run_id, model_version_id, target_sensor_id,
		       predicted_temperature, prediction_horizon_minutes, input_window_size,
		       input_start_at, input_end_at, predicted_for, created_at
		FROM predictions ORDER BY created_at DESC LIMIT 1
	`)
	var p model.Prediction
	err := row.Scan(&p.ID, &p.PredictionRunID, &p.ModelVersionID, &p.TargetSensorID,
		&p.PredictedTemperature, &p.PredictionHorizonMinutes, &p.InputWindowSize,
		&p.InputStartAt, &p.InputEndAt, &p.PredictedFor, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *PredictionRepository) GetByID(ctx context.Context, id int64) (*model.Prediction, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, prediction_run_id, model_version_id, target_sensor_id,
		       predicted_temperature, prediction_horizon_minutes, input_window_size,
		       input_start_at, input_end_at, predicted_for, created_at
		FROM predictions WHERE id = $1
	`, id)
	var p model.Prediction
	err := row.Scan(&p.ID, &p.PredictionRunID, &p.ModelVersionID, &p.TargetSensorID,
		&p.PredictedTemperature, &p.PredictionHorizonMinutes, &p.InputWindowSize,
		&p.InputStartAt, &p.InputEndAt, &p.PredictedFor, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *PredictionRepository) GetHistory(ctx context.Context, limit, offset int) ([]model.Prediction, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, prediction_run_id, model_version_id, target_sensor_id,
		       predicted_temperature, prediction_horizon_minutes, input_window_size,
		       input_start_at, input_end_at, predicted_for, created_at
		FROM predictions ORDER BY created_at DESC LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var results []model.Prediction
	for rows.Next() {
		var p model.Prediction
		if err := rows.Scan(&p.ID, &p.PredictionRunID, &p.ModelVersionID, &p.TargetSensorID,
			&p.PredictedTemperature, &p.PredictionHorizonMinutes, &p.InputWindowSize,
			&p.InputStartAt, &p.InputEndAt, &p.PredictedFor, &p.CreatedAt); err != nil {
			return nil, err
		}
		results = append(results, p)
	}
	return results, nil
}

type AnomalyRepository struct {
	db *pgxpool.Pool
}

func NewAnomalyRepository(db *pgxpool.Pool) *AnomalyRepository {
	return &AnomalyRepository{db: db}
}

func (r *AnomalyRepository) GetLatest(ctx context.Context) (*model.AnomalyEvent, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, prediction_id, sensor_id, status, predicted_temperature,
		       actual_temperature, threshold_normal_max, threshold_anomaly_min,
		       description, detected_at, created_at
		FROM anomaly_events ORDER BY detected_at DESC LIMIT 1
	`)
	var a model.AnomalyEvent
	err := row.Scan(&a.ID, &a.PredictionID, &a.SensorID, &a.Status, &a.PredictedTemperature,
		&a.ActualTemperature, &a.ThresholdNormalMax, &a.ThresholdAnomalyMin,
		&a.Description, &a.DetectedAt, &a.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *AnomalyRepository) GetByID(ctx context.Context, id int64) (*model.AnomalyEvent, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, prediction_id, sensor_id, status, predicted_temperature,
		       actual_temperature, threshold_normal_max, threshold_anomaly_min,
		       description, detected_at, created_at
		FROM anomaly_events WHERE id = $1
	`, id)
	var a model.AnomalyEvent
	err := row.Scan(&a.ID, &a.PredictionID, &a.SensorID, &a.Status, &a.PredictedTemperature,
		&a.ActualTemperature, &a.ThresholdNormalMax, &a.ThresholdAnomalyMin,
		&a.Description, &a.DetectedAt, &a.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *AnomalyRepository) GetList(ctx context.Context, limit, offset int) ([]model.AnomalyEvent, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, prediction_id, sensor_id, status, predicted_temperature,
		       actual_temperature, threshold_normal_max, threshold_anomaly_min,
		       description, detected_at, created_at
		FROM anomaly_events ORDER BY detected_at DESC LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var results []model.AnomalyEvent
	for rows.Next() {
		var a model.AnomalyEvent
		if err := rows.Scan(&a.ID, &a.PredictionID, &a.SensorID, &a.Status, &a.PredictedTemperature,
			&a.ActualTemperature, &a.ThresholdNormalMax, &a.ThresholdAnomalyMin,
			&a.Description, &a.DetectedAt, &a.CreatedAt); err != nil {
			return nil, err
		}
		results = append(results, a)
	}
	return results, nil
}

type NotificationRepository struct {
	db *pgxpool.Pool
}

func NewNotificationRepository(db *pgxpool.Pool) *NotificationRepository {
	return &NotificationRepository{db: db}
}

func (r *NotificationRepository) Save(ctx context.Context, n *model.NotificationLog) (*model.NotificationLog, error) {
	row := r.db.QueryRow(ctx, `
		INSERT INTO notification_logs (anomaly_event_id, channel, recipient, message, status, sent_at, error_message)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, anomaly_event_id, channel, recipient, message, status, sent_at, error_message, created_at
	`, n.AnomalyEventID, n.Channel, n.Recipient, n.Message, n.Status, n.SentAt, n.ErrorMessage)
	var saved model.NotificationLog
	err := row.Scan(&saved.ID, &saved.AnomalyEventID, &saved.Channel, &saved.Recipient,
		&saved.Message, &saved.Status, &saved.SentAt, &saved.ErrorMessage, &saved.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &saved, nil
}

func (r *NotificationRepository) GetLatestByAnomalyEventID(ctx context.Context, anomalyEventID int64) (*model.NotificationLog, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, anomaly_event_id, channel, recipient, message, status, sent_at, error_message, created_at
		FROM notification_logs
		WHERE anomaly_event_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`, anomalyEventID)
	var n model.NotificationLog
	err := row.Scan(&n.ID, &n.AnomalyEventID, &n.Channel, &n.Recipient, &n.Message,
		&n.Status, &n.SentAt, &n.ErrorMessage, &n.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &n, nil
}

func (r *NotificationRepository) GetList(ctx context.Context, limit, offset int) ([]model.NotificationLog, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, anomaly_event_id, channel, recipient, message, status, sent_at, error_message, created_at
		FROM notification_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var results []model.NotificationLog
	for rows.Next() {
		var n model.NotificationLog
		if err := rows.Scan(&n.ID, &n.AnomalyEventID, &n.Channel, &n.Recipient, &n.Message, &n.Status, &n.SentAt, &n.ErrorMessage, &n.CreatedAt); err != nil {
			return nil, err
		}
		results = append(results, n)
	}
	return results, nil
}

type SettingRepository struct {
	db *pgxpool.Pool
}

func NewSettingRepository(db *pgxpool.Pool) *SettingRepository {
	return &SettingRepository{db: db}
}

func (r *SettingRepository) GetAll(ctx context.Context) ([]model.Setting, error) {
	rows, err := r.db.Query(ctx, `SELECT id, key, value, description, updated_at FROM settings ORDER BY key`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var results []model.Setting
	for rows.Next() {
		var s model.Setting
		if err := rows.Scan(&s.ID, &s.Key, &s.Value, &s.Description, &s.UpdatedAt); err != nil {
			return nil, err
		}
		results = append(results, s)
	}
	return results, nil
}

func (r *SettingRepository) Update(ctx context.Context, key, value string) error {
	_, err := r.db.Exec(ctx, `UPDATE settings SET value = $1, updated_at = NOW() WHERE key = $2`, value, key)
	return err
}

func (r *SettingRepository) GetValue(ctx context.Context, key string) (string, error) {
	var value string
	err := r.db.QueryRow(ctx, `SELECT value FROM settings WHERE key = $1`, key).Scan(&value)
	return value, err
}

type LayoutRepository struct {
	db *pgxpool.Pool
}

func NewLayoutRepository(db *pgxpool.Pool) *LayoutRepository {
	return &LayoutRepository{db: db}
}

func (r *LayoutRepository) GetActive(ctx context.Context) (*model.Layout, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, name, description, image_path, is_active, created_at, updated_at
		FROM layouts
		WHERE is_active = TRUE
		ORDER BY updated_at DESC
		LIMIT 1
	`)
	var layout model.Layout
	err := row.Scan(&layout.ID, &layout.Name, &layout.Description, &layout.ImagePath,
		&layout.IsActive, &layout.CreatedAt, &layout.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &layout, nil
}

func (r *LayoutRepository) GetDevices(ctx context.Context, layoutID int64) ([]model.LayoutDeviceView, error) {
	rows, err := r.db.Query(ctx, `
		SELECT ld.id, ld.layout_id, ld.sensor_id, s.sensor_code, s.sensor_role,
		       s.status, ld.pos_x, ld.pos_y, COALESCE(ld.label, s.name)
		FROM layout_devices ld
		JOIN sensors s ON s.id = ld.sensor_id
		WHERE ld.layout_id = $1
		ORDER BY s.sensor_code
	`, layoutID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var devices []model.LayoutDeviceView
	for rows.Next() {
		var device model.LayoutDeviceView
		if err := rows.Scan(&device.ID, &device.LayoutID, &device.SensorID, &device.SensorCode,
			&device.SensorRole, &device.Status, &device.PosX, &device.PosY, &device.Label); err != nil {
			return nil, err
		}
		devices = append(devices, device)
	}
	return devices, nil
}

func (r *LayoutRepository) UpsertDevicePosition(
	ctx context.Context,
	layoutID int64,
	sensorCode string,
	posX float64,
	posY float64,
	label string,
) error {
	result, err := r.db.Exec(ctx, `
		INSERT INTO layout_devices (layout_id, sensor_id, pos_x, pos_y, label)
		SELECT $1, s.id, $3, $4, NULLIF($5, '')
		FROM sensors s
		WHERE s.sensor_code = $2
		ORDER BY s.id
		LIMIT 1
		ON CONFLICT (layout_id, sensor_id)
		DO UPDATE SET pos_x = EXCLUDED.pos_x, pos_y = EXCLUDED.pos_y,
		              label = EXCLUDED.label, updated_at = NOW()
	`, layoutID, sensorCode, posX, posY, label)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("sensor %q not found", sensorCode)
	}
	return nil
}

func (r *LayoutRepository) DeleteDevicePosition(ctx context.Context, layoutID int64, sensorCode string) error {
	_, err := r.db.Exec(ctx, `
		DELETE FROM layout_devices ld
		USING sensors s
		WHERE ld.sensor_id = s.id
		  AND ld.layout_id = $1
		  AND s.sensor_code = $2
	`, layoutID, sensorCode)
	return err
}

type MetricsRepository struct {
	db *pgxpool.Pool
}

func NewMetricsRepository(db *pgxpool.Pool) *MetricsRepository {
	return &MetricsRepository{db: db}
}

func (r *MetricsRepository) GetLatestMetrics(ctx context.Context) (*model.ModelMetrics, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, model_version_id, dataset_start_at, dataset_end_at, train_size, test_size, rmse, mae, mape, created_at
		FROM model_metrics ORDER BY created_at DESC LIMIT 1
	`)
	var m model.ModelMetrics
	err := row.Scan(&m.ID, &m.ModelVersionID, &m.DatasetStartAt, &m.DatasetEndAt, &m.TrainSize, &m.TestSize, &m.RMSE, &m.MAE, &m.MAPE, &m.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *MetricsRepository) GetLatestBaselines(ctx context.Context) ([]model.BaselineResult, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, model_version_id, baseline_type, dataset_start_at, dataset_end_at, rmse, mae, mape, created_at
		FROM baseline_results ORDER BY created_at DESC LIMIT 2
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var results []model.BaselineResult
	for rows.Next() {
		var b model.BaselineResult
		if err := rows.Scan(&b.ID, &b.ModelVersionID, &b.BaselineType, &b.DatasetStartAt, &b.DatasetEndAt, &b.RMSE, &b.MAE, &b.MAPE, &b.CreatedAt); err != nil {
			return nil, err
		}
		results = append(results, b)
	}
	return results, nil
}

type SystemLogRepository struct {
	db *pgxpool.Pool
}

func NewSystemLogRepository(db *pgxpool.Pool) *SystemLogRepository {
	return &SystemLogRepository{db: db}
}

func (r *SystemLogRepository) Save(ctx context.Context, source, level, message string) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO system_logs (source, level, message) VALUES ($1, $2, $3)
	`, source, level, message)
	return err
}

func (r *SystemLogRepository) GetList(ctx context.Context, limit, offset int) ([]model.SystemLog, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, source, level, message, created_at
		FROM system_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var results []model.SystemLog
	for rows.Next() {
		var l model.SystemLog
		if err := rows.Scan(&l.ID, &l.Source, &l.Level, &l.Message, &l.CreatedAt); err != nil {
			return nil, err
		}
		results = append(results, l)
	}
	return results, nil
}
