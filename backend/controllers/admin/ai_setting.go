package admin

import (
	"encoding/json"
	"net/http"
	"strings"

	"portfolio-arl-backend/config"
	"portfolio-arl-backend/models"
	"portfolio-arl-backend/structs"
	"github.com/gin-gonic/gin"
)

type AISettingController struct{}

func NewAISettingController() *AISettingController {
	return &AISettingController{}
}

func (ctrl *AISettingController) GetAISetting(c *gin.Context) {
	var setting models.AISetting
	if err := config.DB.First(&setting).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("AI setting not found"))
		return
	}

	var availableModels []string
	_ = json.Unmarshal([]byte(setting.OllamaAvailableModels), &availableModels)

	maskedOllamaKey := ""
	if strings.TrimSpace(setting.OllamaAPIKey) != "" {
		maskedOllamaKey = "********"
	}

	maskedOpenAIKey := ""
	if strings.TrimSpace(setting.OpenAIAPIKey) != "" {
		maskedOpenAIKey = "********"
	}

	res := structs.AISettingResponse{
		ID:                    setting.ID,
		Provider:              setting.Provider,
		OllamaBaseURL:         setting.OllamaBaseURL,
		OllamaAPIKeyMasked:    maskedOllamaKey,
		OllamaModel:           setting.OllamaModel,
		OllamaAvailableModels: availableModels,
		OpenAIBaseURL:         setting.OpenAIBaseURL,
		OpenAIAPIKeyMasked:    maskedOpenAIKey,
		OpenAIModel:           setting.OpenAIModel,
		ActiveProvider:        setting.ActiveProvider,
		PersonaName:           setting.PersonaName,
		PersonaGreeting:       setting.PersonaGreeting,
		PersonaLanguage:       setting.PersonaLanguage,
		PersonaTone:           setting.PersonaTone,
		PersonaDescription:    setting.PersonaDescription,
		SystemPrompt:          setting.SystemPrompt,
		GuardrailEnabled:      setting.GuardrailEnabled,
		GuardrailMessage:      setting.GuardrailMessage,
		MaxHistoryMessages:    setting.MaxHistoryMessages,
		MaxMessagesPerHour:    setting.MaxMessagesPerHour,
		CreatedAt:             setting.CreatedAt,
		UpdatedAt:             setting.UpdatedAt,
	}

	c.JSON(http.StatusOK, structs.SuccessResponse("AI setting retrieved", res))
}

func (ctrl *AISettingController) UpdateAISetting(c *gin.Context) {
	var req structs.UpdateAISettingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Invalid AI setting payload", nil))
		return
	}

	var setting models.AISetting
	if err := config.DB.First(&setting).Error; err != nil {
		setting = models.AISetting{}
	}

	if req.Provider != "" {
		setting.Provider = req.Provider
	}
	if req.OllamaBaseURL != "" {
		setting.OllamaBaseURL = req.OllamaBaseURL
	}
	if req.OllamaAPIKey != "" && !strings.Contains(req.OllamaAPIKey, "*") {
		setting.OllamaAPIKey = req.OllamaAPIKey
	}
	if req.OllamaModel != "" {
		setting.OllamaModel = req.OllamaModel
	}
	if len(req.OllamaAvailableModels) > 0 {
		modelsJSON, _ := json.Marshal(req.OllamaAvailableModels)
		setting.OllamaAvailableModels = string(modelsJSON)
	}
	if req.OpenAIBaseURL != "" {
		setting.OpenAIBaseURL = req.OpenAIBaseURL
	}
	if req.OpenAIAPIKey != "" && !strings.Contains(req.OpenAIAPIKey, "*") {
		setting.OpenAIAPIKey = req.OpenAIAPIKey
	}
	if req.OpenAIModel != "" {
		setting.OpenAIModel = req.OpenAIModel
	}
	if req.ActiveProvider != "" {
		setting.ActiveProvider = req.ActiveProvider
	}
	if req.PersonaName != "" {
		setting.PersonaName = req.PersonaName
	}
	setting.PersonaGreeting = req.PersonaGreeting
	if req.PersonaLanguage != "" {
		setting.PersonaLanguage = req.PersonaLanguage
	}
	if req.PersonaTone != "" {
		setting.PersonaTone = req.PersonaTone
	}
	setting.PersonaDescription = req.PersonaDescription
	if req.SystemPrompt != "" {
		setting.SystemPrompt = req.SystemPrompt
	}
	setting.GuardrailEnabled = req.GuardrailEnabled
	setting.GuardrailMessage = req.GuardrailMessage
	if req.MaxHistoryMessages > 0 {
		setting.MaxHistoryMessages = req.MaxHistoryMessages
	}
	if req.MaxMessagesPerHour > 0 {
		setting.MaxMessagesPerHour = req.MaxMessagesPerHour
	}

	if err := config.DB.Save(&setting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to update AI setting"))
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse("AI settings updated successfully", gin.H{
		"id": setting.ID,
	}))
}
