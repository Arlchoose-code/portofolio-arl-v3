package admin

import (
	"net/http"
	"strconv"
	"strings"

	"portfolio-arl-backend/config"
	"portfolio-arl-backend/models"
	"portfolio-arl-backend/services"
	"portfolio-arl-backend/structs"
	"github.com/gin-gonic/gin"
)

type ContactController struct{}

func NewContactController() *ContactController {
	return &ContactController{}
}

func (ctrl *ContactController) ListContacts(c *gin.Context) {
	params := services.Pagination.GetPaginationParams(c)
	status := strings.TrimSpace(c.Query("status"))
	isReadQuery := c.Query("is_read")

	query := config.DB.Model(&models.ContactMessage{})

	if params.Search != "" {
		s := "%" + params.Search + "%"
		query = query.Where("name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?", s, s, s, s)
	}

	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}

	if isReadQuery != "" {
		if isReadQuery == "true" || isReadQuery == "1" {
			query = query.Where("is_read = ?", true)
		} else if isReadQuery == "false" || isReadQuery == "0" {
			query = query.Where("is_read = ?", false)
		}
	}

	var total int64
	query.Count(&total)

	var messages []models.ContactMessage
	sortField := "id"
	if params.Sort != "" {
		sortField = params.Sort
	}
	sortOrder := "DESC"
	if params.Order != "" {
		sortOrder = params.Order
	}

	query.Scopes(services.Pagination.Paginate(params)).
		Order(sortField + " " + sortOrder).
		Find(&messages)

	meta := services.Pagination.BuildMeta(params, total)
	c.JSON(http.StatusOK, structs.SuccessWithMeta("Contact messages retrieved", messages, meta))
}

func (ctrl *ContactController) GetContact(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse("Invalid ID"))
		return
	}

	var msg models.ContactMessage
	if err := config.DB.First(&msg, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Contact message not found"))
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse("Contact message retrieved", msg))
}

func (ctrl *ContactController) UpdateContactStatus(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse("Invalid ID"))
		return
	}

	var msg models.ContactMessage
	if err := config.DB.First(&msg, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Contact message not found"))
		return
	}

	var req structs.UpdateContactStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Invalid status update data", nil))
		return
	}

	if req.IsRead != nil {
		msg.IsRead = *req.IsRead
		if msg.IsRead && msg.Status == "unread" {
			msg.Status = "read"
		} else if !msg.IsRead && msg.Status == "read" {
			msg.Status = "unread"
		}
	}

	if req.Status != nil && *req.Status != "" {
		msg.Status = *req.Status
		if msg.Status == "unread" {
			msg.IsRead = false
		} else {
			msg.IsRead = true
		}
	}

	if err := config.DB.Save(&msg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to update message status"))
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse("Status updated successfully", msg))
}

func (ctrl *ContactController) DeleteContact(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse("Invalid ID"))
		return
	}

	var msg models.ContactMessage
	if err := config.DB.First(&msg, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Contact message not found"))
		return
	}

	if err := config.DB.Delete(&msg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to delete contact message"))
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse("Contact message deleted successfully", nil))
}

func (ctrl *ContactController) GetUnreadStats(c *gin.Context) {
	var unreadCount int64
	var totalCount int64

	config.DB.Model(&models.ContactMessage{}).Where("is_read = ?", false).Count(&unreadCount)
	config.DB.Model(&models.ContactMessage{}).Count(&totalCount)

	c.JSON(http.StatusOK, structs.SuccessResponse("Stats retrieved", gin.H{
		"unread_count": unreadCount,
		"total_count":  totalCount,
	}))
}
