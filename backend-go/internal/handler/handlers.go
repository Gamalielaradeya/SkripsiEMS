package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/ems-thermal/backend-go/internal/model"
	"github.com/ems-thermal/backend-go/internal/repository"
	"github.com/ems-thermal/backend-go/internal/sse"
	"github.com/ems-thermal/backend-go/internal/telegram"
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
	gatewayRepo  *repository.GatewayRepository
	sensorRepo   *repository.SensorRepository
	readingRepo  *repository.ReadingRepository
	hub          *sse.Hub
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
	if req.GatewayID == "" || len(req.Readings) == 0 {
		writeError(w, http.StatusBadRequest, "gateway_id and readings are required")
		return
	}

	ctx := r.Context()
	gw, err := h.gatewayRepo.FindByCode(ctx, req.GatewayID)
	if err != nil {
		writeError(w, http.StatusNotFound, "gateway not found: "+req.GatewayID)
		return
	}
	_ = h.gatewayRepo.UpdateLastSeen(ctx, gw.ID)

	var savedReadings []model.SensorReading
	for _, item := range req.Readings {
		sensor, err := h.sensorRepo.FindByCode(ctx, gw.ID, item.SensorCode)
		if err != nil {
			writeError(w, http.StatusNotFound, fmt.Sprintf("sensor %s not found", item.SensorCode))
			return
		}
		quality := "valid"
		if req.Source == "simulator" {
			quality = "simulated"
		}
		sr, err := h.readingRepo.SaveReading(ctx, gw.ID, sensor.ID, item.Temperature, item.Humidity, req.RecordedAt, quality)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "save reading: "+err.Error())
			return
		}
		_ = h.sensorRepo.UpdateLastSeen(ctx, sensor.ID)
		savedReadings = append(savedReadings, *sr)
	}

	// Broadcast SSE
	h.hub.Broadcast("reading.latest", savedReadings)

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"message":  "readings saved",
		"count":    len(savedReadings),
		"readings": savedReadings,
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
}

func NewDashboardHandler(
	sr *repository.SensorRepository,
	rr *repository.ReadingRepository,
	pr *repository.PredictionRepository,
	ar *repository.AnomalyRepository,
	gr *repository.GatewayRepository,
) *DashboardHandler {
	return &DashboardHandler{sensorRepo: sr, readingRepo: rr, predictionRepo: pr, anomalyRepo: ar, gatewayRepo: gr}
}

func (h *DashboardHandler) Summary(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	sensors, _ := h.sensorRepo.ListAll(ctx)
	summary := model.DashboardSummary{
		ThermalStatus: "normal",
		GatewayStatus: "unknown",
	}

	for _, s := range sensors {
		reading, err := h.readingRepo.GetLatestBySensor(ctx, s.ID)
		if err != nil {
			continue
		}
		data := &model.LatestSensorData{
			SensorCode:  s.SensorCode,
			SensorRole:  s.SensorRole,
			Temperature: reading.Temperature,
			Humidity:    reading.Humidity,
			RecordedAt:  reading.RecordedAt,
			Status:      s.Status,
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
		switch {
		case pred.PredictedTemperature < 30:
			summary.ThermalStatus = "normal"
		case pred.PredictedTemperature <= 32:
			summary.ThermalStatus = "waspada"
		default:
			summary.ThermalStatus = "anomali"
		}
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
	var body struct{ Value string `json:"value"` }
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
	notifRepo  *repository.NotificationRepository
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
