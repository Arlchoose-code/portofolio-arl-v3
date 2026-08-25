package services

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"portfolio-arl-backend/models"
	"portfolio-arl-backend/structs"
	"gorm.io/gorm"
)

type AIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type AIService struct {
	client *http.Client
}

var AI = &AIService{
	client: &http.Client{
		Timeout: 90 * time.Second,
	},
}

type OllamaChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type OllamaChatRequest struct {
	Model    string              `json:"model"`
	Messages []OllamaChatMessage `json:"messages"`
	Stream   bool                `json:"stream"`
}

type OllamaChatResponse struct {
	Model     string            `json:"model"`
	CreatedAt string            `json:"created_at"`
	Message   OllamaChatMessage `json:"message"`
	Done      bool              `json:"done"`
}

func (s *AIService) BuildSystemPrompt(setting *models.AISetting, portfolioContext string) string {
	prompt := setting.SystemPrompt
	prompt = strings.ReplaceAll(prompt, "{persona_name}", setting.PersonaName)
	prompt = strings.ReplaceAll(prompt, "{owner_name}", "Syahril Haryono")
	prompt = strings.ReplaceAll(prompt, "{portfolio_data}", portfolioContext)
	prompt = strings.ReplaceAll(prompt, "{persona_tone}", setting.PersonaTone)
	prompt = strings.ReplaceAll(prompt, "{persona_language}", setting.PersonaLanguage)
	prompt = strings.ReplaceAll(prompt, "{persona_description}", setting.PersonaDescription)

	guidance := `

=== PANDUAN INFORMASI & INTERAKSI ASISTEN ===
1. Tugas utamamu adalah menjadi asisten portofolio yang ramah, informatif, dan membantu menjawab pertanyaan seputar Syahril Haryono (profil, pengalaman kerja, proyek, keterampilan teknis, sertifikasi, dan pendidikan).
2. Jika pengunjung menanyakan atau meminta fitur web tools (seperti Cek Nickname Game, YouTube Downloader, Base64 Codec, Password Generator, QRIS Modifier, TOTP 2FA, dll):
   - Jelaskan fungsi tools tersebut secara ramah dan ringkas.
   - Berikan tautan langsung ke halaman tools terkait agar pengunjung dapat menggunakannya secara interaktif di website:
     • 🎮 [Cek Nickname Game Online](/tools/cek-nickname-game-online)
     • 🎬 [YouTube Media Downloader](/tools/youtube-downloader)
     • ⚙️ [Base64 Converter](/tools/base64-converter)
     • 🔐 [Password Generator](/tools/password-generator)
     • 💳 [QRIS Dynamic Modifier](/tools/qris-converter)
     • 🔑 [2FA TOTP Generator](/tools/2fa-generator)
     • 🌐 [Pusat Semua Tools & Utilitas](/tools)
3. Jawab pertanyaan dengan gaya bahasa yang ramah, profesional, dan menyenangkan.
`
	prompt += guidance
	return prompt
}

func (s *AIService) DetectNeedAnimation(message string) bool {
	lower := strings.ToLower(message)
	if lower == "halo" || lower == "hai" || lower == "siapa namamu" || lower == "siapa kamu" || lower == "tes" || lower == "test" || lower == "ok" || lower == "makasih" || lower == "terima kasih" {
		return false
	}

	keywords := []string{
		"project", "proyek", "portfolio", "portofolio", "github", "repo", "aplikasi", "sistem",
		"skill", "keahlian", "kemampuan", "bahasa", "stack", "teknologi", "tech",
		"experience", "pengalaman", "kerja", "karier", "career", "riwayat",
		"certificate", "sertifikat", "lisensi", "credential", "kursus",
		"education", "pendidikan", "kuliah", "universitas", "unj",
		"cari", "tampilkan", "list", "daftar", "tabel", "kontak", "tools",
	}
	for _, kw := range keywords {
		if strings.Contains(lower, kw) {
			return true
		}
	}
	return false
}

func (s *AIService) DetermineThinkingSteps(message string) []structs.ThinkingStep {
	lower := strings.ToLower(message)
	var steps []structs.ThinkingStep

	if strings.Contains(lower, "project") || strings.Contains(lower, "proyek") || strings.Contains(lower, "repo") || strings.Contains(lower, "aplikasi") {
		steps = append(steps, structs.ThinkingStep{Action: "searching", Label: "Searching portfolio projects & systems..."})
	} else if strings.Contains(lower, "skill") || strings.Contains(lower, "keahlian") || strings.Contains(lower, "stack") || strings.Contains(lower, "tech") {
		steps = append(steps, structs.ThinkingStep{Action: "searching", Label: "Scanning technical skills & proficiency..."})
	} else if strings.Contains(lower, "pengalaman") || strings.Contains(lower, "kerja") || strings.Contains(lower, "experience") || strings.Contains(lower, "karier") {
		steps = append(steps, structs.ThinkingStep{Action: "searching", Label: "Analyzing professional work history..."})
	} else if strings.Contains(lower, "sertifikat") || strings.Contains(lower, "certificate") || strings.Contains(lower, "lisensi") {
		steps = append(steps, structs.ThinkingStep{Action: "searching", Label: "Verifying official certifications & credentials..."})
	} else if strings.Contains(lower, "education") || strings.Contains(lower, "pendidikan") || strings.Contains(lower, "kuliah") {
		steps = append(steps, structs.ThinkingStep{Action: "searching", Label: "Checking education background & organizations..."})
	} else if strings.Contains(lower, "tool") || strings.Contains(lower, "utilitas") || strings.Contains(lower, "fitur") {
		steps = append(steps, structs.ThinkingStep{Action: "searching", Label: "Memuat informasi tools & utilitas..."})
	} else {
		steps = append(steps, structs.ThinkingStep{Action: "searching", Label: "Retrieving portfolio information..."})
	}

	return steps
}

// StreamChat streams Ollama/OpenAI responses directly
func (s *AIService) StreamChat(
	ctx context.Context,
	db *gorm.DB,
	messages []AIMessage,
	setting *models.AISetting,
	onThinking func(action string, label string),
	onChunk func(chunk string) error,
) error {
	provider := setting.ActiveProvider
	if provider == "" {
		provider = setting.Provider
	}

	if provider == "openai_compatible" {
		return s.streamOpenAI(ctx, messages, setting, onChunk)
	}

	return s.streamOllama(ctx, messages, setting, onChunk)
}

func (s *AIService) streamOllama(
	ctx context.Context,
	messages []AIMessage,
	setting *models.AISetting,
	onChunk func(chunk string) error,
) error {
	baseURL := strings.TrimRight(setting.OllamaBaseURL, "/")
	if baseURL == "" {
		baseURL = "http://localhost:11434"
	}
	endpoint := fmt.Sprintf("%s/api/chat", baseURL)

	modelName := setting.OllamaModel
	if modelName == "" {
		modelName = "gemma4:31b-cloud"
	}

	var oMessages []OllamaChatMessage
	for _, m := range messages {
		oMessages = append(oMessages, OllamaChatMessage{
			Role:    m.Role,
			Content: m.Content,
		})
	}

	reqPayload := OllamaChatRequest{
		Model:    modelName,
		Messages: oMessages,
		Stream:   true,
	}

	reqBytes, err := json.Marshal(reqPayload)
	if err != nil {
		return err
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewBuffer(reqBytes))
	if err != nil {
		return err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	if setting.OllamaAPIKey != "" {
		key := strings.TrimSpace(setting.OllamaAPIKey)
		if strings.HasPrefix(key, "Bearer ") {
			httpReq.Header.Set("Authorization", key)
		} else {
			httpReq.Header.Set("Authorization", "Bearer "+key)
		}
		httpReq.Header.Set("x-api-key", key)
	}

	httpResp, err := s.client.Do(httpReq)
	if err != nil {
		return err
	}
	defer httpResp.Body.Close()

	if httpResp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(httpResp.Body)
		return fmt.Errorf("ollama stream error %d: %s", httpResp.StatusCode, string(respBody))
	}

	scanner := bufio.NewScanner(httpResp.Body)
	for scanner.Scan() {
		line := scanner.Bytes()
		if len(line) == 0 {
			continue
		}

		var chunk OllamaChatResponse
		if err := json.Unmarshal(line, &chunk); err == nil {
			if chunk.Message.Content != "" {
				if err := onChunk(chunk.Message.Content); err != nil {
					return err
				}
			}
			if chunk.Done {
				break
			}
		}
	}
	return scanner.Err()
}

func (s *AIService) streamOpenAI(
	ctx context.Context,
	messages []AIMessage,
	setting *models.AISetting,
	onChunk func(chunk string) error,
) error {
	baseURL := strings.TrimRight(setting.OpenAIBaseURL, "/")
	if baseURL == "" {
		baseURL = "https://api.openai.com/v1"
	}
	endpoint := fmt.Sprintf("%s/chat/completions", baseURL)

	type OpenAIMessage struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	}

	type OpenAIRequest struct {
		Model    string          `json:"model"`
		Messages []OpenAIMessage `json:"messages"`
		Stream   bool            `json:"stream"`
	}

	var oMessages []OpenAIMessage
	for _, m := range messages {
		oMessages = append(oMessages, OpenAIMessage{
			Role:    m.Role,
			Content: m.Content,
		})
	}

	modelName := setting.OpenAIModel
	if modelName == "" {
		modelName = "gpt-4o"
	}

	reqBody := OpenAIRequest{
		Model:    modelName,
		Messages: oMessages,
		Stream:   true,
	}

	reqBytes, err := json.Marshal(reqBody)
	if err != nil {
		return err
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewBuffer(reqBytes))
	if err != nil {
		return err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	if setting.OpenAIAPIKey != "" {
		httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", setting.OpenAIAPIKey))
	}

	httpResp, err := s.client.Do(httpReq)
	if err != nil {
		return err
	}
	defer httpResp.Body.Close()

	if httpResp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(httpResp.Body)
		return fmt.Errorf("openai error %d: %s", httpResp.StatusCode, string(respBody))
	}

	scanner := bufio.NewScanner(httpResp.Body)
	for scanner.Scan() {
		line := scanner.Text()
		if !strings.HasPrefix(line, "data: ") {
			continue
		}
		dataStr := strings.TrimPrefix(line, "data: ")
		if strings.TrimSpace(dataStr) == "[DONE]" {
			break
		}

		type OpenAIDelta struct {
			Content string `json:"content"`
		}
		type OpenAIChoice struct {
			Delta OpenAIDelta `json:"delta"`
		}
		type OpenAIChunk struct {
			Choices []OpenAIChoice `json:"choices"`
		}

		var chunk OpenAIChunk
		if err := json.Unmarshal([]byte(dataStr), &chunk); err == nil {
			if len(chunk.Choices) > 0 && chunk.Choices[0].Delta.Content != "" {
				if err := onChunk(chunk.Choices[0].Delta.Content); err != nil {
					return err
				}
			}
		}
	}

	return scanner.Err()
}
