package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/ems-thermal/backend-go/internal/model"
	"github.com/ems-thermal/backend-go/internal/repository"
	"github.com/ems-thermal/backend-go/internal/sse"
	"github.com/ems-thermal/backend-go/internal/telegram"
	"github.com/jackc/pgx/v5"
)

// ─── Response helpers ──────────────────────────────────────────────────────

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

// ─── HealthHandler ────────────────────────────────────────────────────────

type HealthHandler struct{}

func NewHealthHandler() *HealthHandler { return &HealthHandler{} }

func (h *HealthHandler) Health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status":  "ok",
		"service": "EMS LSTM Thermal Anomaly Backend",
		"time":    time.Now().Format(time.RFC3339),
	})
}

// ─── ReadingHandler ───────────────────────────────────────────────────────

type ReadingHandler struct {
	gatewayRepo *repository.GatewayRepository
	sensorRepo  *repository.SensorRepository
	readingRepo *repository.ReadingRepository
	hub         *sse.Hub
}

type preparedReading struct {
	item    model.SensorReadingItem
	sensor  *model.Sensor
	quality string
	trouble bool
}

func validateGatewayReading(req model.GatewayReadingRequest) error {
	if strings.TrimSpace(req.GatewayID) == "" || len(req.Readings) == 0 {
		return fmt.Errorf("gateway_id and readings are required")
	}
	if req.RecordedAt.IsZero() {
		return fmt.Errorf("recorded_at is required")
	}
	for _, item := range req.Readings {
		if strings.TrimSpace(item.SensorCode) == "" {
			return fmt.Errorf("sensor_code is required")
		}
		if isTroubleQuality(item.QualityStatus) {
			continue
		}
		if math.IsNaN(item.Temperature) || math.IsInf(item.Temperature, 0) ||
			item.Temperature < 0 || item.Temperature > 80 {
			return fmt.Errorf("sensor %s temperature must be between 0 and 80", item.SensorCode)
		}
		if math.IsNaN(item.Humidity) || math.IsInf(item.Humidity, 0) ||
			item.Humidity < 0 || item.Humidity > 100 {
			return fmt.Errorf("sensor %s humidity must be between 0 and 100", item.SensorCode)
		}
	}
	return nil
}

func isTroubleQuality(quality string) bool {
	switch strings.ToLower(strings.TrimSpace(quality)) {
	case "timeout", "invalid", "trouble":
		return true
	default:
		return false
	}
}

func storedQuality(source, quality string) string {
	if strings.EqualFold(source, "simulator") || strings.EqualFold(quality, "simulated") {
		return "simulated"
	}
	return "valid"
}

func NewReadingHandler(
	gr *repository.GatewayRepository,
	sr *repository.SensorRepository,
	rr *repository.ReadingRepository,
	hub *sse.Hub,
) *ReadingHandler {
	return &ReadingHandler{gatewayRepo: gr, sensorRepo: sr, readingRepo: rr, hub: hub}
}

func (h *ReadingHandler) CreateReading(w http.ResponseWriter, r *http.Request) {
	var req model.GatewayReadingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
		return
	}
	if err := validateGatewayReading(req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx := r.Context()
	gw, err := h.gatewayRepo.FindByCode(ctx, req.GatewayID)
	if err != nil {
		writeError(w, http.StatusNotFound, "gateway not found: "+req.GatewayID)
		return
	}
	_ = h.gatewayRepo.UpdateLastSeen(ctx, gw.ID)

	prepared := make([]preparedReading, 0, len(req.Readings))
	for _, item := range req.Readings {
		sensor, err := h.sensorRepo.FindByCode(ctx, gw.ID, item.SensorCode)
		if err != nil {
			writeError(w, http.StatusNotFound, fmt.Sprintf("sensor %s not found", item.SensorCode))
			return
		}
		prepared = append(prepared, preparedReading{
			item:    item,
			sensor:  sensor,
			quality: storedQuality(req.Source, item.QualityStatus),
			trouble: isTroubleQuality(item.QualityStatus),
		})
	}

	var savedReadings []model.SensorReading
	var troubleSensors []map[string]string
	for _, p := range prepared {
		if p.trouble {
			_ = h.sensorRepo.UpdateStatus(ctx, p.sensor.ID, "trouble")
			troubleSensors = append(troubleSensors, map[string]string{
				"sensor_code":    p.item.SensorCode,
				"quality_status": p.item.QualityStatus,
			})
			continue
		}
		sr, err := h.readingRepo.SaveReading(ctx, gw.ID, p.sensor.ID, p.item.Temperature, p.item.Humidity, req.RecordedAt, p.quality)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "save reading: "+err.Error())
			return
		}
		_ = h.sensorRepo.UpdateLastSeen(ctx, p.sensor.ID)
		savedReadings = append(savedReadings, *sr)
	}

	if len(savedReadings) > 0 {
		h.hub.Broadcast("reading.latest", savedReadings)
	}
	if len(troubleSensors) > 0 {
		h.hub.Broadcast("sensor.trouble", troubleSensors)
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"message":       "readings processed",
		"count":         len(savedReadings),
		"trouble_count": len(troubleSensors),
		"readings":      savedReadings,
		"trouble":       troubleSensors,
	})
}

func (h *ReadingHandler) GetLatest(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	sensors, err := h.sensorRepo.ListAll(ctx)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	result := make(map[string]interface{})
	for _, s := range sensors {
		reading, err := h.readingRepo.GetLatestBySensor(ctx, s.ID)
		if err == nil {
			result[s.SensorCode] = reading
		}
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ReadingHandler) GetHistory(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit <= 0 || limit > 500 {
		limit = 100
	}

	ctx := r.Context()
	readings, err := h.readingRepo.GetHistoryAll(ctx, limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"readings": readings,
		"limit":    limit,
		"offset":   offset,
	})
}

// ─── GatewayHandler ───────────────────────────────────────────────────────

type GatewayHandler struct {
	gatewayRepo *repository.GatewayRepository
}

func NewGatewayHandler(gr *repository.GatewayRepository) *GatewayHandler {
	return &GatewayHandler{gatewayRepo: gr}
}

func (h *GatewayHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	var req model.GatewayStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	gw, err := h.gatewayRepo.FindByCode(r.Context(), req.GatewayID)
	if err != nil {
		writeError(w, http.StatusNotFound, "gateway not found")
		return
	}
	_ = h.gatewayRepo.UpdateLastSeen(r.Context(), gw.ID)
	writeJSON(w, http.StatusOK, map[string]string{"message": "gateway status updated"})
}

// ─── DashboardHandler ─────────────────────────────────────────────────────

type DashboardHandler struct {
	sensorRepo     *repository.SensorRepository
	readingRepo    *repository.ReadingRepository
	predictionRepo *repository.PredictionRepository
	anomalyRepo    *repository.AnomalyRepository
	gatewayRepo    *repository.GatewayRepository
	settingRepo    *repository.SettingRepository
}

func NewDashboardHandler(
	sr *repository.SensorRepository,
	rr *repository.ReadingRepository,
	pr *repository.PredictionRepository,
	ar *repository.AnomalyRepository,
	gr *repository.GatewayRepository,
	str *repository.SettingRepository,
) *DashboardHandler {
	return &DashboardHandler{
		sensorRepo: sr, readingRepo: rr, predictionRepo: pr,
		anomalyRepo: ar, gatewayRepo: gr, settingRepo: str,
	}
}

func settingFloat(ctxValue func(string) (string, error), key string, fallback float64) float64 {
	raw, err := ctxValue(key)
	if err != nil {
		return fallback
	}
	value, err := strconv.ParseFloat(raw, 64)
	if err != nil {
		return fallback
	}
	return value
}

func isFresh(lastSeen *time.Time, timeout time.Duration, now time.Time) bool {
	return lastSeen != nil && now.Sub(*lastSeen) <= timeout
}

func classifyPredictedThermalStatus(predictedTemp, thresholdNormalMax, thresholdAnomalyMin float64) string {
	switch {
	case predictedTemp < thresholdNormalMax:
		return "normal"
	case predictedTemp <= thresholdAnomalyMin:
		return "waspada"
	default:
		return "anomali"
	}
}

func (h *DashboardHandler) Summary(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	now := time.Now()
	getSetting := func(key string) (string, error) {
		return h.settingRepo.GetValue(ctx, key)
	}
	thresholdNormal := settingFloat(getSetting, "threshold_normal_max", 30)
	thresholdAnomaly := settingFloat(getSetting, "threshold_anomaly_min", 32)
	timeoutSeconds := settingFloat(getSetting, "gateway_timeout_seconds", 120)
	timeout := time.Duration(timeoutSeconds * float64(time.Second))

	sensors, _ := h.sensorRepo.ListAll(ctx)
	summary := model.DashboardSummary{
		ThermalStatus: "normal",
		GatewayStatus: "offline",
	}
	gw, err := h.gatewayRepo.GetLatest(ctx)
	if err == nil && isFresh(gw.LastSeenAt, timeout, now) {
		summary.GatewayStatus = "online"
	}

	hasTrouble := false
	for _, s := range sensors {
		reading, err := h.readingRepo.GetLatestBySensor(ctx, s.ID)
		if err != nil {
			hasTrouble = true
			continue
		}
		status := s.Status
		if status == "trouble" || !isFresh(s.LastSeenAt, timeout, now) {
			status = "trouble"
			hasTrouble = true
		}
		data := &model.LatestSensorData{
			SensorCode:  s.SensorCode,
			SensorRole:  s.SensorRole,
			Temperature: reading.Temperature,
			Humidity:    reading.Humidity,
			RecordedAt:  reading.RecordedAt,
			Status:      status,
		}
		if s.SensorCode == "S1" {
			summary.S1Latest = data
		} else if s.SensorCode == "S2" {
			summary.S2Latest = data
			t := reading.RecordedAt
			summary.LastUpdatedAt = &t
		}
	}

	pred, err := h.predictionRepo.GetLatest(ctx)
	if err == nil {
		summary.LatestPrediction = pred
		summary.ThermalStatus = classifyPredictedThermalStatus(
			pred.PredictedTemperature, thresholdNormal, thresholdAnomaly,
		)
	}
	if summary.GatewayStatus == "offline" || hasTrouble {
		summary.ThermalStatus = "trouble"
	}

	writeJSON(w, http.StatusOK, summary)
}

// ─── PredictionHandler ────────────────────────────────────────────────────

type PredictionHandler struct {
	predictionRepo *repository.PredictionRepository
}

func NewPredictionHandler(pr *repository.PredictionRepository) *PredictionHandler {
	return &PredictionHandler{predictionRepo: pr}
}

func (h *PredictionHandler) GetLatest(w http.ResponseWriter, r *http.Request) {
	p, err := h.predictionRepo.GetLatest(r.Context())
	if err != nil {
		writeJSON(w, http.StatusOK, nil)
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func (h *PredictionHandler) GetHistory(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	preds, err := h.predictionRepo.GetHistory(r.Context(), limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"predictions": preds, "limit": limit, "offset": offset})
}

// ─── AnomalyHandler ───────────────────────────────────────────────────────

type AnomalyHandler struct {
	anomalyRepo *repository.AnomalyRepository
}

func NewAnomalyHandler(ar *repository.AnomalyRepository) *AnomalyHandler {
	return &AnomalyHandler{anomalyRepo: ar}
}

func (h *AnomalyHandler) GetLatest(w http.ResponseWriter, r *http.Request) {
	a, err := h.anomalyRepo.GetLatest(r.Context())
	if err != nil {
		writeJSON(w, http.StatusOK, nil)
		return
	}
	writeJSON(w, http.StatusOK, a)
}

func (h *AnomalyHandler) GetList(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit <= 0 || limit > 500 {
		limit = 50
	}
	anomalies, err := h.anomalyRepo.GetList(r.Context(), limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"anomalies": anomalies, "limit": limit, "offset": offset})
}

// ─── MetricsHandler ───────────────────────────────────────────────────────

type LayoutHandler struct {
	layoutRepo *repository.LayoutRepository
}

func NewLayoutHandler(lr *repository.LayoutRepository) *LayoutHandler {
	return &LayoutHandler{layoutRepo: lr}
}

func (h *LayoutHandler) GetActive(w http.ResponseWriter, r *http.Request) {
	layout, err := h.layoutRepo.GetActive(r.Context())
	if err != nil {
		writeError(w, http.StatusNotFound, "active layout not found")
		return
	}
	devices, err := h.layoutRepo.GetDevices(r.Context(), layout.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "load layout devices: "+err.Error())
		return
	}
	writeJSON(w, http.StatusOK, model.ActiveLayoutResponse{Layout: layout, Devices: devices})
}

func validLayoutPosition(posX, posY float64) bool {
	return !math.IsNaN(posX) && !math.IsInf(posX, 0) && posX >= 0 && posX <= 100 &&
		!math.IsNaN(posY) && !math.IsInf(posY, 0) && posY >= 0 && posY <= 100
}

func (h *LayoutHandler) UpdateDevicePosition(w http.ResponseWriter, r *http.Request) {
	sensorCode := r.PathValue("sensorCode")
	var req model.UpdateLayoutDeviceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
		return
	}
	if !validLayoutPosition(req.PosX, req.PosY) {
		writeError(w, http.StatusBadRequest, "pos_x and pos_y must be between 0 and 100")
		return
	}
	layout, err := h.layoutRepo.GetActive(r.Context())
	if err != nil {
		writeError(w, http.StatusNotFound, "active layout not found")
		return
	}
	if err := h.layoutRepo.UpsertDevicePosition(r.Context(), layout.ID, sensorCode, req.PosX, req.PosY, req.Label); err != nil {
		writeError(w, http.StatusInternalServerError, "save layout position: "+err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "layout position saved"})
}

func (h *LayoutHandler) DeleteDevicePosition(w http.ResponseWriter, r *http.Request) {
	layout, err := h.layoutRepo.GetActive(r.Context())
	if err != nil {
		writeError(w, http.StatusNotFound, "active layout not found")
		return
	}
	if err := h.layoutRepo.DeleteDevicePosition(r.Context(), layout.ID, r.PathValue("sensorCode")); err != nil {
		writeError(w, http.StatusInternalServerError, "delete layout position: "+err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "layout position deleted"})
}

type MLInferenceHandler struct {
	predictionRepo *repository.PredictionRepository
	anomalyRepo    *repository.AnomalyRepository
	notifRepo      *repository.NotificationRepository
	telegramSvc    *telegram.Service
	hub            *sse.Hub
}

func NewMLInferenceHandler(
	pr *repository.PredictionRepository,
	ar *repository.AnomalyRepository,
	nr *repository.NotificationRepository,
	tg *telegram.Service,
	hub *sse.Hub,
) *MLInferenceHandler {
	return &MLInferenceHandler{
		predictionRepo: pr,
		anomalyRepo:    ar,
		notifRepo:      nr,
		telegramSvc:    tg,
		hub:            hub,
	}
}

func shouldNotifyThermalStatus(status string) bool {
	return status == "waspada" || status == "anomali"
}

func (h *MLInferenceHandler) ProcessEvent(w http.ResponseWriter, r *http.Request) {
	var req model.MLInferenceEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
		return
	}
	if req.PredictionID <= 0 || req.AnomalyEventID <= 0 {
		writeError(w, http.StatusBadRequest, "prediction_id and anomaly_event_id are required")
		return
	}

	ctx := r.Context()
	pred, err := h.predictionRepo.GetByID(ctx, req.PredictionID)
	if err != nil {
		writeError(w, http.StatusNotFound, "prediction not found")
		return
	}
	anomaly, err := h.anomalyRepo.GetByID(ctx, req.AnomalyEventID)
	if err != nil {
		writeError(w, http.StatusNotFound, "anomaly event not found")
		return
	}
	if anomaly.PredictionID != pred.ID {
		writeError(w, http.StatusBadRequest, "anomaly event does not belong to prediction")
		return
	}

	h.hub.Broadcast("prediction.latest", map[string]interface{}{
		"prediction":     pred,
		"thermal_status": anomaly.Status,
	})
	h.hub.Broadcast("anomaly.created", anomaly)

	if !shouldNotifyThermalStatus(anomaly.Status) {
		writeJSON(w, http.StatusAccepted, map[string]string{"status": "processed"})
		return
	}

	existing, err := h.notifRepo.GetLatestByAnomalyEventID(ctx, anomaly.ID)
	if err == nil {
		h.hub.Broadcast("notification.sent", existing)
		writeJSON(w, http.StatusAccepted, map[string]string{"status": "already_processed"})
		return
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusInternalServerError, "check notification log: "+err.Error())
		return
	}

	alert := h.telegramSvc.SendAlert(
		anomaly.Status,
		fmt.Sprintf("%.2f", anomaly.PredictedTemperature),
		pred.PredictedFor.Format(time.RFC3339),
		anomaly.DetectedAt.Format(time.RFC3339),
	)
	anomalyID := anomaly.ID
	saved, err := h.notifRepo.Save(ctx, &model.NotificationLog{
		AnomalyEventID: &anomalyID,
		Channel:        "telegram",
		Recipient:      alert.Recipient,
		Message:        alert.Message,
		Status:         alert.Status,
		SentAt:         alert.SentAt,
		ErrorMessage:   alert.ErrorMessage,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "save notification log: "+err.Error())
		return
	}
	h.hub.Broadcast("notification.sent", saved)
	writeJSON(w, http.StatusAccepted, map[string]interface{}{
		"status":       "processed",
		"notification": saved,
	})
}

type MetricsHandler struct {
	metricsRepo *repository.MetricsRepository
}

func NewMetricsHandler(mr *repository.MetricsRepository) *MetricsHandler {
	return &MetricsHandler{metricsRepo: mr}
}

func (h *MetricsHandler) GetLatestMetrics(w http.ResponseWriter, r *http.Request) {
	m, err := h.metricsRepo.GetLatestMetrics(r.Context())
	if err != nil {
		writeJSON(w, http.StatusOK, nil)
		return
	}
	writeJSON(w, http.StatusOK, m)
}

func (h *MetricsHandler) GetLatestBaselines(w http.ResponseWriter, r *http.Request) {
	b, err := h.metricsRepo.GetLatestBaselines(r.Context())
	if err != nil {
		writeJSON(w, http.StatusOK, []interface{}{})
		return
	}
	writeJSON(w, http.StatusOK, b)
}

// ─── SettingsHandler ──────────────────────────────────────────────────────

type SettingsHandler struct {
	settingRepo *repository.SettingRepository
}

func NewSettingsHandler(sr *repository.SettingRepository) *SettingsHandler {
	return &SettingsHandler{settingRepo: sr}
}

func (h *SettingsHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	settings, err := h.settingRepo.GetAll(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, settings)
}

func (h *SettingsHandler) Update(w http.ResponseWriter, r *http.Request) {
	key := r.PathValue("key")
	var body struct {
		Value string `json:"value"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := h.settingRepo.Update(r.Context(), key, body.Value); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "setting updated"})
}

// ─── NotificationHandler ─────────────────────────────────────────────────

type NotificationHandler struct {
	notifRepo   *repository.NotificationRepository
	telegramSvc *telegram.Service
}

func NewNotificationHandler(nr *repository.NotificationRepository, tg *telegram.Service) *NotificationHandler {
	return &NotificationHandler{notifRepo: nr, telegramSvc: tg}
}

func (h *NotificationHandler) GetList(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit <= 0 || limit > 500 {
		limit = 50
	}
	logs, err := h.notifRepo.GetList(r.Context(), limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"notifications": logs, "limit": limit, "offset": offset})
}

func (h *NotificationHandler) SendTest(w http.ResponseWriter, r *http.Request) {
	if err := h.telegramSvc.SendTest(); err != nil {
		writeJSON(w, http.StatusOK, map[string]string{"status": "failed", "error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "sent"})
}

// ─── SystemLogHandler ─────────────────────────────────────────────────────

type SystemLogHandler struct {
	logRepo *repository.SystemLogRepository
}

func NewSystemLogHandler(lr *repository.SystemLogRepository) *SystemLogHandler {
	return &SystemLogHandler{logRepo: lr}
}

func (h *SystemLogHandler) GetList(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	logs, err := h.logRepo.GetList(r.Context(), limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"logs": logs, "limit": limit, "offset": offset})
}
