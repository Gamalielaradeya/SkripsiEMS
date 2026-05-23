package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Telegram TelegramConfig
	App      AppConfig
}

type ServerConfig struct {
	Port string
	Env  string
}

type DatabaseConfig struct {
	Host         string
	Port         string
	Name         string
	User         string
	Password     string
	SSLMode      string
	MaxOpenConns int
	MaxIdleConns int
}

type TelegramConfig struct {
	BotToken        string
	ChatID          string
	Enabled         bool
	CooldownMinutes int
}

type AppConfig struct {
	GatewayAPIToken    string
	CORSAllowedOrigins string
	LogLevel           string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	maxOpen, _ := strconv.Atoi(getEnv("DB_MAX_OPEN_CONNS", "25"))
	maxIdle, _ := strconv.Atoi(getEnv("DB_MAX_IDLE_CONNS", "10"))
	cooldown, _ := strconv.Atoi(getEnv("TELEGRAM_COOLDOWN_MINUTES", "5"))
	telegramEnabled, _ := strconv.ParseBool(getEnv("TELEGRAM_ENABLED", "false"))

	cfg := &Config{
		Server: ServerConfig{
			Port: getEnv("SERVER_PORT", "8080"),
			Env:  getEnv("SERVER_ENV", "development"),
		},
		Database: DatabaseConfig{
			Host:         getEnv("DB_HOST", "localhost"),
			Port:         getEnv("DB_PORT", "5432"),
			Name:         getEnv("DB_NAME", "ems_db"),
			User:         getEnv("DB_USER", "ems_user"),
			Password:     getEnv("DB_PASSWORD", "ems_password"),
			SSLMode:      getEnv("DB_SSL_MODE", "disable"),
			MaxOpenConns: maxOpen,
			MaxIdleConns: maxIdle,
		},
		Telegram: TelegramConfig{
			BotToken:        getEnv("TELEGRAM_BOT_TOKEN", ""),
			ChatID:          getEnv("TELEGRAM_CHAT_ID", ""),
			Enabled:         telegramEnabled,
			CooldownMinutes: cooldown,
		},
		App: AppConfig{
			GatewayAPIToken:    getEnv("GATEWAY_API_TOKEN", "dev-token-change-in-production"),
			CORSAllowedOrigins: getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:5173"),
			LogLevel:           getEnv("LOG_LEVEL", "info"),
		},
	}

	return cfg, nil
}

func (d *DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%s dbname=%s user=%s password=%s sslmode=%s",
		d.Host, d.Port, d.Name, d.User, d.Password, d.SSLMode,
	)
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
