package telegram

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"sync"
	"time"

	"github.com/ems-thermal/backend-go/internal/repository"
	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
)

type Service struct {
	settingRepo *repository.SettingRepository
	cooldown    time.Duration
	lastSentAt  map[string]time.Time
	mu          sync.Mutex
}

type AlertResult struct {
	Recipient    *string
	Message      string
	Status       string
	SentAt       *time.Time
	ErrorMessage *string
}

func New(settingRepo *repository.SettingRepository) *Service {
	return &Service{
		settingRepo: settingRepo,
		cooldown:    5 * time.Minute, // Default, will be overridden by DB
		lastSentAt:  make(map[string]time.Time),
	}
}

func (s *Service) getBotAndConfig() (*tgbotapi.BotAPI, int64, bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	settings, err := s.settingRepo.GetAll(ctx)
	if err != nil {
		return nil, 0, false, err
	}

	var token, chatIDStr, enabledStr, cooldownStr string
	for _, st := range settings {
		switch st.Key {
		case "telegram_bot_token":
			token = st.Value
		case "telegram_chat_id":
			chatIDStr = st.Value
		case "telegram_enabled":
			enabledStr = st.Value
		case "telegram_cooldown_minutes":
			cooldownStr = st.Value
		}
	}

	enabled := enabledStr == "true"
	if cooldownStr != "" {
		var c int
		if _, err := fmt.Sscanf(cooldownStr, "%d", &c); err == nil {
			s.cooldown = time.Duration(c) * time.Minute
		}
	}

	if !enabled || token == "" {
		return nil, 0, false, nil
	}

	chatID, err := strconv.ParseInt(chatIDStr, 10, 64)
	if err != nil {
		return nil, 0, false, fmt.Errorf("telegram_chat_id invalid: %w", err)
	}

	bot, err := tgbotapi.NewBotAPI(token)
	if err != nil {
		return nil, 0, false, err
	}

	return bot, chatID, enabled, nil
}

func alertMessage(status, predictedTemp, predictedFor, detectedAt string) string {
	return fmt.Sprintf(`[EMS THERMAL ALERT]

Status        : %s
Sensor Acuan  : S2 - Hotspot/Exhaust
Prediksi S2   : %s°C
Horizon       : 5 menit ke depan
Waktu Prediksi: %s
Waktu Deteksi : %s

Sistem memprediksi suhu melewati batas operasional.
Silakan cek dashboard EMS untuk tindakan pemantauan.`,
		status, predictedTemp, predictedFor, detectedAt)
}

// SendAlert sends a thermal alert message with cooldown
func (s *Service) SendAlert(status, predictedTemp, predictedFor, detectedAt string) AlertResult {
	s.mu.Lock()
	defer s.mu.Unlock()

	result := AlertResult{
		Message: alertMessage(status, predictedTemp, predictedFor, detectedAt),
		Status:  "skipped",
	}
	bot, chatID, enabled, err := s.getBotAndConfig()
	if err != nil {
		log.Printf("[telegram] Error loading config: %v", err)
		result.Status = "failed"
		errMsg := err.Error()
		result.ErrorMessage = &errMsg
		return result
	}
	if !enabled || bot == nil {
		errMsg := "telegram disabled or token empty"
		result.ErrorMessage = &errMsg
		return result
	}
	recipient := strconv.FormatInt(chatID, 10)
	result.Recipient = &recipient

	// Check cooldown per status
	if last, ok := s.lastSentAt[status]; ok {
		if time.Since(last) < s.cooldown {
			log.Printf("[telegram] Cooldown aktif untuk status %s, skip.", status)
			errMsg := "telegram cooldown active"
			result.ErrorMessage = &errMsg
			return result
		}
	}

	m := tgbotapi.NewMessage(chatID, result.Message)
	_, err = bot.Send(m)
	if err != nil {
		log.Printf("[telegram] Send failed: %v", err)
		result.Status = "failed"
		errMsg := err.Error()
		result.ErrorMessage = &errMsg
		return result
	}

	now := time.Now()
	s.lastSentAt[status] = now
	result.Status = "sent"
	result.SentAt = &now
	log.Printf("[telegram] Alert sent: %s", status)
	return result
}

// SendTest sends a test message
func (s *Service) SendTest() error {
	bot, chatID, enabled, err := s.getBotAndConfig()
	if err != nil {
		return err
	}
	if !enabled || bot == nil {
		return fmt.Errorf("telegram tidak aktif atau token kosong")
	}
	msg := tgbotapi.NewMessage(chatID, "[EMS] Test notifikasi berhasil. Sistem Telegram aktif.")
	_, err = bot.Send(msg)
	return err
}
