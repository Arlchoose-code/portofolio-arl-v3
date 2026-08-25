package admin

import (
	"net/http"
	"strconv"

	"portfolio-arl-backend/config"
	"portfolio-arl-backend/models"
	"portfolio-arl-backend/services"
	"portfolio-arl-backend/structs"
	"github.com/gin-gonic/gin"
)

type ChatSessionController struct{}

func NewChatSessionController() *ChatSessionController {
	return &ChatSessionController{}
}

func (ctrl *ChatSessionController) ListChatSessions(c *gin.Context) {
	params := services.Pagination.GetPaginationParams(c)
	query := config.DB.Model(&models.ChatSession{}).Preload("Messages")

	if params.Search != "" {
		query = query.Where("session_key LIKE ? OR ip_address LIKE ?", "%"+params.Search+"%", "%"+params.Search+"%")
	}

	var total int64
	query.Count(&total)

	var sessions []models.ChatSession
	query.Scopes(services.Pagination.Paginate(params)).
		Order("last_activity_at DESC, id DESC").
		Find(&sessions)

	meta := services.Pagination.BuildMeta(params, total)
	c.JSON(http.StatusOK, structs.SuccessWithMeta("Chat sessions retrieved", sessions, meta))
}

func (ctrl *ChatSessionController) GetChatSession(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var session models.ChatSession
	if err := config.DB.Preload("Messages").First(&session, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Chat session not found"))
		return
	}
	c.JSON(http.StatusOK, structs.SuccessResponse("Chat session retrieved", session))
}

func (ctrl *ChatSessionController) DeleteChatSession(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var session models.ChatSession
	if err := config.DB.First(&session, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Chat session not found"))
		return
	}

	_ = config.DB.Where("session_id = ?", session.ID).Delete(&models.ChatMessage{})
	if err := config.DB.Delete(&session).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to delete session"))
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse("Chat session deleted successfully", nil))
}

func (ctrl *ChatSessionController) DeleteAllChatSessions(c *gin.Context) {
	_ = config.DB.Exec("DELETE FROM chat_messages")
	_ = config.DB.Exec("DELETE FROM chat_sessions")
	c.JSON(http.StatusOK, structs.SuccessResponse("All chat sessions cleared successfully", nil))
}
