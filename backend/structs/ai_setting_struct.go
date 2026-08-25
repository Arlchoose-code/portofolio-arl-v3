package structs

import "time"

type UpdateAISettingRequest struct {
	Provider              string   `json:"provider"`
	OllamaBaseURL         string   `json:"ollama_base_url"`
	OllamaAPIKey          string   `json:"ollama_api_key"`
	OllamaModel           string   `json:"ollama_model"`
	OllamaAvailableModels []string `json:"ollama_available_models"`
	OpenAIBaseURL         string   `json:"openai_base_url"`
	OpenAIAPIKey          string   `json:"openai_api_key"`
	OpenAIModel           string   `json:"openai_model"`
	ActiveProvider        string   `json:"active_provider"`
	PersonaName           string   `json:"persona_name"`
	PersonaGreeting       string   `json:"persona_greeting"`
	PersonaLanguage       string   `json:"persona_language"`
	PersonaTone           string   `json:"persona_tone"`
	PersonaDescription    string   `json:"persona_description"`
	SystemPrompt          string   `json:"system_prompt"`
	GuardrailEnabled      bool     `json:"guardrail_enabled"`
	GuardrailMessage      string   `json:"guardrail_message"`
	MaxHistoryMessages    int      `json:"max_history_messages"`
	MaxMessagesPerHour    int      `json:"max_messages_per_hour"`
}

type AISettingResponse struct {
	ID                    uint     `json:"id"`
	Provider              string   `json:"provider"`
	OllamaBaseURL         string   `json:"ollama_base_url"`
	OllamaAPIKeyMasked    string   `json:"ollama_api_key_masked"`
	OllamaModel           string   `json:"ollama_model"`
	OllamaAvailableModels []string `json:"ollama_available_models"`
	OpenAIBaseURL         string   `json:"openai_base_url"`
	OpenAIAPIKeyMasked    string   `json:"openai_api_key_masked"`
	OpenAIModel           string   `json:"openai_model"`
	ActiveProvider        string   `json:"active_provider"`
	PersonaName           string   `json:"persona_name"`
	PersonaGreeting       string   `json:"persona_greeting"`
	PersonaLanguage       string   `json:"persona_language"`
	PersonaTone           string   `json:"persona_tone"`
	PersonaDescription    string   `json:"persona_description"`
	SystemPrompt          string   `json:"system_prompt"`
	GuardrailEnabled      bool     `json:"guardrail_enabled"`
	GuardrailMessage      string   `json:"guardrail_message"`
	MaxHistoryMessages    int      `json:"max_history_messages"`
	MaxMessagesPerHour    int      `json:"max_messages_per_hour"`
	CreatedAt             time.Time `json:"created_at"`
	UpdatedAt             time.Time `json:"updated_at"`
}

type CreateChatSessionResponse struct {
	SessionKey string `json:"session_key"`
}

type SendChatMessageRequest struct {
	SessionKey string `json:"session_key" binding:"required"`
	Message    string `json:"message" binding:"required"`
}

type ThinkingStep struct {
	Action string `json:"action"` // searching, reading
	Label  string `json:"label"`  // "Mencari informasi project...", etc.
}
