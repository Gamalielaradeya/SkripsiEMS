package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	appconfig "github.com/ems-thermal/backend-go/internal/config"
	"github.com/ems-thermal/backend-go/internal/config"
	"github.com/ems-thermal/backend-go/internal/handler"
	"github.com/ems-thermal/backend-go/internal/middleware"
	"github.com/ems-thermal/backend-go/internal/repository"
	"github.com/ems-thermal/backend-go/internal/sse"
	"github.com/ems-thermal/backend-go/internal/telegram"
)

func main() {
	// ── Load Config ──────────────────────────────────────────────
	cfg, err := appconfig.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// ── Connect Database ─────────────────────────────────────────
	db, err := config.Connect(cfg.Database.DSN(), cfg.Database.MaxOpenConns, cfg.Database.MaxIdleConns)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()
	log.Println("[main] Database connected.")

	// ── Init Repositories ─────────────────────────────────────────
	gatewayRepo := repository.NewGatewayRepository(db)
	sensorRepo  := repository.NewSensorRepository(db)
	readingRepo := repository.NewReadingRepository(db)
	predRepo    := repository.NewPredictionRepository(db)
	anomalyRepo := repository.NewAnomalyRepository(db)
	notifRepo   := repository.NewNotificationRepository(db)
	settingRepo := repository.NewSettingRepository(db)
	metricsRepo := repository.NewMetricsRepository(db)
	syslogRepo  := repository.NewSystemLogRepository(db)

	// ── Init SSE Hub ──────────────────────────────────────────────
	hub := sse.NewHub()

	// ── Init Telegram ─────────────────────────────────────────────
	tgSvc := telegram.New(settingRepo)

	// ── Init Handlers ─────────────────────────────────────────────
	healthH    := handler.NewHealthHandler()
	readingH   := handler.NewReadingHandler(gatewayRepo, sensorRepo, readingRepo, hub)
	gatewayH   := handler.NewGatewayHandler(gatewayRepo)
	dashboardH := handler.NewDashboardHandler(sensorRepo, readingRepo, predRepo, anomalyRepo, gatewayRepo)
	predH      := handler.NewPredictionHandler(predRepo)
	anomalyH   := handler.NewAnomalyHandler(anomalyRepo)
	metricsH   := handler.NewMetricsHandler(metricsRepo)
	settingsH  := handler.NewSettingsHandler(settingRepo)
	notifH     := handler.NewNotificationHandler(notifRepo, tgSvc)
	syslogH    := handler.NewSystemLogHandler(syslogRepo)

	// ── Router ────────────────────────────────────────────────────
	r := chi.NewRouter()

	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Timeout(60 * time.Second))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{cfg.App.CORSAllowedOrigins},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	// ── Public / Dashboard routes (no auth) ───────────────────────
	r.Get("/api/v1/health",              healthH.Health)
	r.Get("/api/v1/events",             hub.ServeHTTP)
	r.Get("/api/v1/dashboard/summary",  dashboardH.Summary)
	r.Get("/api/v1/readings/latest",    readingH.GetLatest)
	r.Get("/api/v1/readings/history",   readingH.GetHistory)
	r.Get("/api/v1/sensors", func(w http.ResponseWriter, r *http.Request) {
		sensors, err := sensorRepo.ListAll(r.Context())
		if err != nil {
			http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(sensors)
	})
	r.Get("/api/v1/predictions/latest",   predH.GetLatest)
	r.Get("/api/v1/predictions/history",  predH.GetHistory)
	r.Get("/api/v1/anomalies",            anomalyH.GetList)
	r.Get("/api/v1/anomalies/latest",     anomalyH.GetLatest)
	r.Get("/api/v1/model-metrics/latest", metricsH.GetLatestMetrics)
	r.Get("/api/v1/baselines/latest",     metricsH.GetLatestBaselines)
	r.Get("/api/v1/settings",             settingsH.GetAll)
	r.Put("/api/v1/settings/{key}",       settingsH.Update)
	r.Get("/api/v1/notifications",        notifH.GetList)
	r.Post("/api/v1/notifications/test",  notifH.SendTest)
	r.Get("/api/v1/system-logs",          syslogH.GetList)

	// ── Gateway routes (requires Bearer token) ────────────────────
	r.Group(func(r chi.Router) {
		r.Use(middleware.BearerAuth(cfg.App.GatewayAPIToken))
		r.Post("/api/v1/readings",        readingH.CreateReading)
		r.Post("/api/v1/readings/batch",  readingH.CreateReading)
		r.Post("/api/v1/gateway/status",  gatewayH.UpdateStatus)
	})

	// ── HTTP Server ───────────────────────────────────────────────
	srv := &http.Server{
		Addr:         ":" + cfg.Server.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Printf("[main] EMS Backend running on http://localhost:%s", cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	<-quit
	log.Println("[main] Shutting down...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
	log.Println("[main] Server stopped.")
}
