package config

import (
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	App          AppConfig
	Database     DatabaseConfig
	JWT          JWTConfig
	Cookie       CookieConfig
	Storage      StorageConfig
	Revalidation RevalidationConfig
	CORS         CORSConfig
	Admin        AdminConfig
	AI           AIConfig
	Chatbot      ChatbotConfig
	Turnstile    TurnstileConfig
}

type AppConfig struct {
	Env  string
	Port string
	URL  string
	Name string
}

type DatabaseConfig struct {
	Host string
	Port string
	User string
	Pass string
	Name string
}

type JWTConfig struct {
	Secret        string
	AccessExpire  time.Duration
	RefreshExpire time.Duration
}

type CookieConfig struct {
	AccessTokenName  string
	RefreshTokenName string
}

type StorageConfig struct {
	Path           string
	ThumbnailWidth int
	MediumWidth    int
	OriginalWidth  int
	MaxSizeMB      int64
}

type RevalidationConfig struct {
	NextjsURL          string
	Secret             string
	WorkerPollInterval time.Duration
	MaxAttempts        int
}

type CORSConfig struct {
	AllowedOrigins []string
}

type AdminConfig struct {
	Email    string
	Password string
	Name     string
}

type AIConfig struct {
	OllamaBaseURL            string
	OllamaAPIKey             string
	OllamaDefaultModel       string
	OpenAICompatibleBaseURL  string
	OpenAICompatibleAPIKey   string
	OpenAICompatibleModel    string
	DefaultProvider          string
	MaxHistoryMessages       int
	MaxMessagesPerHour       int
	RequestTimeoutSeconds    time.Duration
	StreamChunkSize          int
}

type ChatbotConfig struct {
	Name             string
	OwnerName        string
	Language         string
	Tone             string
	GuardrailEnabled bool
}

type TurnstileConfig struct {
	Enabled   bool
	SiteKey   string
	SecretKey string
}

var AppConfigInstance *Config

func LoadConfig() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("Note: .env file not found or already loaded into environment")
	}

	cfg := &Config{
		App: AppConfig{
			Env:  getEnv("APP_ENV", "development"),
			Port: getEnv("APP_PORT", "8080"),
			URL:  getEnv("APP_URL", "http://localhost:8080"),
			Name: getEnv("APP_NAME", "Portfolio Arl"),
		},
		Database: DatabaseConfig{
			Host: getEnv("DB_HOST", "localhost"),
			Port: getEnv("DB_PORT", "3306"),
			User: getEnv("DB_USER", "root"),
			Pass: getEnv("DB_PASS", ""),
			Name: getEnv("DB_NAME", "portofolio_arl"),
		},
		JWT: JWTConfig{
			Secret:        getEnv("JWT_SECRET", "super_secret_jwt_key_syahril_haryono_arlchoose_2026"),
			AccessExpire:  parseDuration(getEnv("JWT_ACCESS_EXPIRE", "15m"), 15*time.Minute),
			RefreshExpire: parseDuration(getEnv("JWT_REFRESH_EXPIRE", "168h"), 7*24*time.Hour),
		},
		Cookie: CookieConfig{
			AccessTokenName:  getEnv("ACCESS_TOKEN_COOKIE_NAME", "access_token"),
			RefreshTokenName: getEnv("REFRESH_TOKEN_COOKIE_NAME", "refresh_token"),
		},
		Storage: StorageConfig{
			Path:           getEnv("STORAGE_PATH", "./storage/media"),
			ThumbnailWidth: getEnvAsInt("IMAGE_THUMBNAIL_WIDTH", 400),
			MediumWidth:    getEnvAsInt("IMAGE_MEDIUM_WIDTH", 900),
			OriginalWidth:  getEnvAsInt("IMAGE_ORIGINAL_WIDTH", 1920),
			MaxSizeMB:      int64(getEnvAsInt("IMAGE_MAX_SIZE_MB", 50)),
		},
		Revalidation: RevalidationConfig{
			NextjsURL:          getEnv("NEXTJS_URL", "http://localhost:3000"),
			Secret:             getEnv("NEXTJS_REVALIDATE_SECRET", "portfolio_arl_revalidate_secret_key_2026"),
			WorkerPollInterval: time.Duration(getEnvAsInt("REVALIDATION_WORKER_POLL_INTERVAL", 2)) * time.Second,
			MaxAttempts:        getEnvAsInt("REVALIDATION_MAX_ATTEMPTS", 3),
		},
		CORS: CORSConfig{
			AllowedOrigins: strings.Split(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000"), ","),
		},
		Admin: AdminConfig{
			Email:    getEnv("ADMIN_EMAIL", "admin@arlab.my.id"),
			Password: getEnv("ADMIN_PASSWORD", "changeme123"),
			Name:     getEnv("ADMIN_NAME", "Syahril Haryono"),
		},
		AI: AIConfig{
			OllamaBaseURL:           getEnv("OLLAMA_BASE_URL", "http://localhost:11434"),
			OllamaAPIKey:            getEnv("OLLAMA_API_KEY", ""),
			OllamaDefaultModel:      getEnv("OLLAMA_DEFAULT_MODEL", "gemma4:31b-cloud"),
			OpenAICompatibleBaseURL: getEnv("OPENAI_COMPATIBLE_BASE_URL", "https://api.openai.com/v1"),
			OpenAICompatibleAPIKey:  getEnv("OPENAI_COMPATIBLE_API_KEY", ""),
			OpenAICompatibleModel:   getEnv("OPENAI_COMPATIBLE_MODEL", "gpt-4o"),
			DefaultProvider:         getEnv("AI_DEFAULT_PROVIDER", "ollama"),
			MaxHistoryMessages:      getEnvAsInt("AI_MAX_HISTORY_MESSAGES", 20),
			MaxMessagesPerHour:      getEnvAsInt("AI_MAX_MESSAGES_PER_HOUR", 30),
			RequestTimeoutSeconds:   time.Duration(getEnvAsInt("AI_REQUEST_TIMEOUT_SECONDS", 60)) * time.Second,
			StreamChunkSize:         getEnvAsInt("AI_STREAM_CHUNK_SIZE", 10),
		},
		Chatbot: ChatbotConfig{
			Name:             getEnv("CHATBOT_NAME", "Arl"),
			OwnerName:        getEnv("CHATBOT_OWNER_NAME", "Syahril Haryono"),
			Language:         getEnv("CHATBOT_LANGUAGE", "id"),
			Tone:             getEnv("CHATBOT_TONE", "friendly"),
			GuardrailEnabled: getEnvAsBool("CHATBOT_GUARDRAIL_ENABLED", true),
		},
		Turnstile: TurnstileConfig{
			Enabled:   getEnvAsBool("CLOUDFLARE_TURNSTILE_ENABLED", false),
			SiteKey:   getEnv("CLOUDFLARE_TURNSTILE_SITE_KEY", ""),
			SecretKey: getEnv("CLOUDFLARE_TURNSTILE_SECRET_KEY", ""),
		},
	}

	AppConfigInstance = cfg
	return cfg
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok && strings.TrimSpace(val) != "" {
		return val
	}
	return fallback
}

func getEnvAsInt(key string, fallback int) int {
	strVal := getEnv(key, "")
	if strVal == "" {
		return fallback
	}
	if intVal, err := strconv.Atoi(strVal); err == nil {
		return intVal
	}
	return fallback
}

func getEnvAsBool(key string, fallback bool) bool {
	strVal := getEnv(key, "")
	if strVal == "" {
		return fallback
	}
	if boolVal, err := strconv.ParseBool(strVal); err == nil {
		return boolVal
	}
	return fallback
}

func parseDuration(val string, fallback time.Duration) time.Duration {
	if d, err := time.ParseDuration(val); err == nil {
		return d
	}
	return fallback
}
