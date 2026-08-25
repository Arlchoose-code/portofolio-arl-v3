package models

import "time"

type AISetting struct {
	ID                    uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Provider              string    `gorm:"size:50;default:'ollama'" json:"provider"` // ollama, openai_compatible
	OllamaBaseURL         string    `gorm:"size:255" json:"ollama_base_url"`
	OllamaAPIKey          string    `gorm:"size:255" json:"-"`
	OllamaModel           string    `gorm:"size:100" json:"ollama_model"`
	OllamaAvailableModels string    `gorm:"type:text" json:"ollama_available_models"` // JSON array
	OpenAIBaseURL         string    `gorm:"size:255" json:"openai_base_url"`
	OpenAIAPIKey          string    `gorm:"size:255" json:"-"`
	OpenAIModel           string    `gorm:"size:100" json:"openai_model"`
	ActiveProvider        string    `gorm:"size:50;default:'ollama'" json:"active_provider"`
	PersonaName           string    `gorm:"size:100;default:'Arl'" json:"persona_name"`
	PersonaGreeting       string    `gorm:"type:text" json:"persona_greeting"`
	PersonaLanguage       string    `gorm:"size:20;default:'id'" json:"persona_language"` // id, en, mixed
	PersonaTone           string    `gorm:"size:50;default:'friendly'" json:"persona_tone"` // formal, casual, friendly
	PersonaDescription    string    `gorm:"type:text" json:"persona_description"`
	SystemPrompt          string    `gorm:"type:longtext" json:"system_prompt"`
	GuardrailEnabled      bool      `gorm:"default:true" json:"guardrail_enabled"`
	GuardrailMessage      string    `gorm:"type:text" json:"guardrail_message"`
	MaxHistoryMessages    int       `gorm:"default:20" json:"max_history_messages"`
	MaxMessagesPerHour    int       `gorm:"default:30" json:"max_messages_per_hour"`
	CreatedAt             time.Time `json:"created_at"`
	UpdatedAt             time.Time `json:"updated_at"`
}
