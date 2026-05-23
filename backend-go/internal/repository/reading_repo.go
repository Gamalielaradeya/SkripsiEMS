package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/ems-thermal/backend-go/internal/model"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ReadingRepository struct {
	db *pgxpool.Pool
}

func NewReadingRepository(db *pgxpool.Pool) *ReadingRepository {
	return &ReadingRepository{db: db}
}

// SaveReading inserts one sensor reading
func (r *ReadingRepository) SaveReading(ctx context.Context, gatewayID, sensorID int64, temp, hum float64, recordedAt time.Time, quality string) (*model.SensorReading, error) {
	row := r.db.QueryRow(ctx, `
		INSERT INTO sensor_readings (gateway_id, sensor_id, temperature, humidity, recorded_at, quality_status)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, gateway_id, sensor_id, temperature, humidity, recorded_at, quality_status, created_at
	`, gatewayID, sensorID, temp, hum, recordedAt, quality)

	var sr model.SensorReading
	err := row.Scan(&sr.ID, &sr.GatewayID, &sr.SensorID, &sr.Temperature, &sr.Humidity, &sr.RecordedAt, &sr.QualityStatus, &sr.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("save reading: %w", err)
	}
	return &sr, nil
}

// GetLatestBySensor returns the most recent reading for a sensor
func (r *ReadingRepository) GetLatestBySensor(ctx context.Context, sensorID int64) (*model.SensorReading, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, gateway_id, sensor_id, temperature, humidity, recorded_at, quality_status, created_at
		FROM sensor_readings
		WHERE sensor_id = $1
		ORDER BY recorded_at DESC
		LIMIT 1
	`, sensorID)

	var sr model.SensorReading
	err := row.Scan(&sr.ID, &sr.GatewayID, &sr.SensorID, &sr.Temperature, &sr.Humidity, &sr.RecordedAt, &sr.QualityStatus, &sr.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &sr, nil
}

// GetHistory returns paginated sensor readings
func (r *ReadingRepository) GetHistory(ctx context.Context, sensorID int64, limit, offset int) ([]model.SensorReading, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, gateway_id, sensor_id, temperature, humidity, recorded_at, quality_status, created_at
		FROM sensor_readings
		WHERE sensor_id = $1
		ORDER BY recorded_at DESC
		LIMIT $2 OFFSET $3
	`, sensorID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []model.SensorReading
	for rows.Next() {
		var sr model.SensorReading
		if err := rows.Scan(&sr.ID, &sr.GatewayID, &sr.SensorID, &sr.Temperature, &sr.Humidity, &sr.RecordedAt, &sr.QualityStatus, &sr.CreatedAt); err != nil {
			return nil, err
		}
		results = append(results, sr)
	}
	return results, nil
}

// GetHistoryAll returns paginated readings for all sensors
func (r *ReadingRepository) GetHistoryAll(ctx context.Context, limit, offset int) ([]model.SensorReading, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, gateway_id, sensor_id, temperature, humidity, recorded_at, quality_status, created_at
		FROM sensor_readings
		ORDER BY recorded_at DESC
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []model.SensorReading
	for rows.Next() {
		var sr model.SensorReading
		if err := rows.Scan(&sr.ID, &sr.GatewayID, &sr.SensorID, &sr.Temperature, &sr.Humidity, &sr.RecordedAt, &sr.QualityStatus, &sr.CreatedAt); err != nil {
			return nil, err
		}
		results = append(results, sr)
	}
	return results, nil
}

// GetLast30BySensor returns last 30 readings for ML inference
func (r *ReadingRepository) GetLast30BySensor(ctx context.Context, sensorID int64) ([]model.SensorReading, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, gateway_id, sensor_id, temperature, humidity, recorded_at, quality_status, created_at
		FROM sensor_readings
		WHERE sensor_id = $1
		ORDER BY recorded_at DESC
		LIMIT 30
	`, sensorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []model.SensorReading
	for rows.Next() {
		var sr model.SensorReading
		if err := rows.Scan(&sr.ID, &sr.GatewayID, &sr.SensorID, &sr.Temperature, &sr.Humidity, &sr.RecordedAt, &sr.QualityStatus, &sr.CreatedAt); err != nil {
			return nil, err
		}
		results = append(results, sr)
	}
	return results, nil
}
