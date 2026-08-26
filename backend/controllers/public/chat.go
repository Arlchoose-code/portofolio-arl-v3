package public

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"portfolio-arl-backend/config"
	"portfolio-arl-backend/models"
	"portfolio-arl-backend/services"
	"portfolio-arl-backend/structs"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ChatController struct{}

func NewChatController() *ChatController {
	return &ChatController{}
}

func (ctrl *ChatController) CreateSession(c *gin.Context) {
	sessionKey := uuid.New().String()
	c.JSON(http.StatusOK, structs.SuccessResponse("Session initialized", structs.CreateChatSessionResponse{
		SessionKey: sessionKey,
	}))
}

func (ctrl *ChatController) SendMessage(c *gin.Context) {
	var req structs.SendChatMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.Message) == "" {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Message is required", nil))
		return
	}

	// 1. Fetch AISetting
	var aiSetting models.AISetting
	if err := config.DB.First(&aiSetting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("AI settings not initialized"))
		return
	}

	// 2. Fetch or Create Session
	var session models.ChatSession
	now := time.Now()
	if err := config.DB.Where("session_key = ?", req.SessionKey).First(&session).Error; err != nil {
		sessionKey := req.SessionKey
		if sessionKey == "" {
			sessionKey = uuid.New().String()
		}
		session = models.ChatSession{
			SessionKey:       sessionKey,
			IPAddress:        c.ClientIP(),
			UserAgent:        c.GetHeader("User-Agent"),
			MessagesThisHour: 0,
			HourWindowStart:  now,
			CreatedAt:        now,
			LastActivityAt:   now,
		}
		config.DB.Create(&session)
	}

	// 3. Rate Limit (Max messages per hour)
	if now.Sub(session.HourWindowStart) > time.Hour {
		session.HourWindowStart = now
		session.MessagesThisHour = 0
	}

	maxPerHour := aiSetting.MaxMessagesPerHour
	if maxPerHour <= 0 {
		maxPerHour = 30
	}

	if session.MessagesThisHour >= maxPerHour {
		c.JSON(http.StatusTooManyRequests, structs.ErrorResponse("Rate limit reached. Please wait before sending more messages."))
		return
	}

	session.MessagesThisHour++
	session.LastActivityAt = now
	config.DB.Save(&session)

	// 4. Save User Message
	userMsg := models.ChatMessage{
		SessionID: session.ID,
		Role:      "user",
		Content:   req.Message,
		CreatedAt: now,
	}
	config.DB.Create(&userMsg)

	// Set SSE Headers
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("Transfer-Encoding", "chunked")
	c.Writer.Header().Set("X-Accel-Buffering", "no")
	c.Writer.Flush()

	// 5. Guardrail check
	isOnTopic := services.Guardrail.CheckIsOnTopic(req.Message, &aiSetting)
	if !isOnTopic {
		rejectText := aiSetting.GuardrailMessage
		if rejectText == "" {
			rejectText = "Maaf, saya hanya dapat menjawab pertanyaan seputar portofolio, keahlian, pengalaman, dan proyek dari Syahril Haryono."
		}

		sendSSEEvent(c.Writer, "message", gin.H{"content": rejectText})
		sendSSEEvent(c.Writer, "done", gin.H{})

		asstMsg := models.ChatMessage{
			SessionID:  session.ID,
			Role:       "assistant",
			Content:    rejectText,
			IsRejected: true,
			CreatedAt:  time.Now(),
		}
		config.DB.Create(&asstMsg)
		return
	}

	// 6. Thinking Step Animation
	var thinkingJSON string
	if services.AI.DetectNeedAnimation(req.Message) {
		steps := services.AI.DetermineThinkingSteps(req.Message)
		stepBytes, _ := json.Marshal(steps)
		thinkingJSON = string(stepBytes)

		for _, step := range steps {
			sendSSEEvent(c.Writer, "thinking", step)
			time.Sleep(150 * time.Millisecond)
		}
	}

	// 7. Context & Messages Preparation
	portfolioData := services.Guardrail.GetPortfolioContext(config.DB)
	systemPrompt := services.AI.BuildSystemPrompt(&aiSetting, portfolioData)

	var chatHistory []models.ChatMessage
	maxHistory := aiSetting.MaxHistoryMessages
	if maxHistory <= 0 {
		maxHistory = 20
	}
	config.DB.Where("session_id = ?", session.ID).
		Order("id DESC").
		Limit(maxHistory).
		Find(&chatHistory)

	// Reverse chatHistory to chronological order
	for i, j := 0, len(chatHistory)-1; i < j; i, j = i+1, j-1 {
		chatHistory[i], chatHistory[j] = chatHistory[j], chatHistory[i]
	}

	var aiMessages []services.AIMessage
	aiMessages = append(aiMessages, services.AIMessage{
		Role:    "system",
		Content: systemPrompt,
	})

	for _, m := range chatHistory {
		aiMessages = append(aiMessages, services.AIMessage{
			Role:    m.Role,
			Content: m.Content,
		})
	}

	// 8. Stream AI Response with Ollama Native Tool Calling
	var fullResponse strings.Builder
	err := services.AI.StreamChat(
		c.Request.Context(),
		config.DB,
		aiMessages,
		&aiSetting,
		func(action string, label string) {
			sendSSEEvent(c.Writer, "thinking", gin.H{
				"action": action,
				"label":  label,
			})
			c.Writer.Flush()
		},
		func(chunk string) error {
			fullResponse.WriteString(chunk)
			sendSSEEvent(c.Writer, "message", gin.H{"content": chunk})
			c.Writer.Flush()
			return nil
		},
	)

	if err != nil {
		errorMsg := "\n\n[Terjadi kendala saat memproses jawaban AI. Silakan coba kembali.]"
		fullResponse.WriteString(errorMsg)
		sendSSEEvent(c.Writer, "message", gin.H{"content": errorMsg})
	}

	sendSSEEvent(c.Writer, "done", gin.H{})
	c.Writer.Flush()

	// 9. Save Assistant Message
	asstMsg := models.ChatMessage{
		SessionID:     session.ID,
		Role:          "assistant",
		Content:       fullResponse.String(),
		IsRejected:    false,
		ThinkingSteps: thinkingJSON,
		CreatedAt:     time.Now(),
	}
	config.DB.Create(&asstMsg)
}

func (ctrl *ChatController) GetHistory(c *gin.Context) {
	sessionKey := c.Query("session_key")
	if sessionKey == "" {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse("session_key is required"))
		return
	}

	var session models.ChatSession
	if err := config.DB.Where("session_key = ?", sessionKey).First(&session).Error; err != nil {
		c.JSON(http.StatusOK, structs.SuccessResponse("No history found", []models.ChatMessage{}))
		return
	}

	var messages []models.ChatMessage
	config.DB.Where("session_id = ?", session.ID).
		Order("created_at ASC").
		Limit(50).
		Find(&messages)

	c.JSON(http.StatusOK, structs.SuccessResponse("History retrieved", messages))
}

func (ctrl *ChatController) DeleteSession(c *gin.Context) {
	sessionKey := c.Query("session_key")
	if sessionKey == "" {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse("session_key is required"))
		return
	}

	// Preserve chat history in database so site admin retains audit and visitor inquiry logs.
	// Only admin via /api/admin/chat-sessions has permission to permanently delete records.
	c.JSON(http.StatusOK, structs.SuccessResponse("Chat history reset successfully", nil))
}

func sendSSEEvent(w io.Writer, event string, data any) {
	jsonBytes, _ := json.Marshal(data)
	fmt.Fprintf(w, "event: %s\ndata: %s\n\n", event, string(jsonBytes))
	if f, ok := w.(http.Flusher); ok {
		f.Flush()
	}
}
