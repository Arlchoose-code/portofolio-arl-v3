package admin

import (
	"fmt"
	"html"
	"net/http"
	"strconv"
	"strings"
	"time"

	"portfolio-arl-backend/config"
	"portfolio-arl-backend/models"
	"portfolio-arl-backend/services"
	"portfolio-arl-backend/structs"
	"github.com/gin-gonic/gin"
)

type MailboxController struct{}

func NewMailboxController() *MailboxController {
	return &MailboxController{}
}

func (ctrl *MailboxController) ListEmails(c *gin.Context) {
	params := services.Pagination.GetPaginationParams(c)
	folder := strings.ToLower(strings.TrimSpace(c.DefaultQuery("folder", "inbox"))) // inbox, sent, starred, trash, all

	query := config.DB.Model(&models.EmailThread{})

	switch folder {
	case "inbox":
		query = query.Where("is_trash = ? AND is_archived = ? AND id IN (SELECT DISTINCT thread_id FROM email_messages WHERE direction = 'inbound')", false, false)
	case "sent":
		// Threads where messages were sent (outbound)
		query = query.Where("is_trash = ? AND id IN (SELECT DISTINCT thread_id FROM email_messages WHERE direction = 'outbound')", false)
	case "starred":
		query = query.Where("is_starred = ? AND is_trash = ?", true, false)
	case "trash":
		query = query.Where("is_trash = ?", true)
	default:
		query = query.Where("is_trash = ?", false)
	}

	if params.Search != "" {
		s := "%" + params.Search + "%"
		query = query.Where("subject LIKE ? OR snippet LIKE ? OR id IN (SELECT DISTINCT thread_id FROM email_messages WHERE from_email LIKE ? OR to_email LIKE ? OR from_name LIKE ?)", s, s, s, s, s)
	}

	var total int64
	query.Count(&total)

	var threads []models.EmailThread
	query.Scopes(services.Pagination.Paginate(params)).
		Order("last_message_at DESC, id DESC").
		Find(&threads)

	meta := services.Pagination.BuildMeta(params, total)
	c.JSON(http.StatusOK, structs.SuccessWithMeta("Email threads retrieved", threads, meta))
}

func (ctrl *MailboxController) GetThread(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse("Invalid ID"))
		return
	}

	var thread models.EmailThread
	if err := config.DB.First(&thread, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Email thread not found"))
		return
	}

	var messages []models.EmailMessage
	config.DB.Where("thread_id = ?", thread.ID).Order("id ASC").Find(&messages)
	thread.Messages = messages

	// Mark all messages in thread as read
	if thread.HasUnread {
		thread.HasUnread = false
		config.DB.Save(&thread)
		config.DB.Model(&models.EmailMessage{}).Where("thread_id = ? AND is_read = ?", thread.ID, false).Update("is_read", true)
	}

	c.JSON(http.StatusOK, structs.SuccessResponse("Thread retrieved", thread))
}

func (ctrl *MailboxController) SendEmail(c *gin.Context) {
	var req structs.SendEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Data email tidak valid", nil))
		return
	}

	// Fetch email settings
	var setting models.EmailSetting
	config.DB.First(&setting)

	toEmail := strings.TrimSpace(req.ToEmail)
	toName := strings.TrimSpace(req.ToName)
	if toName == "" {
		toName = strings.Split(toEmail, "@")[0]
	}
	subject := strings.TrimSpace(req.Subject)
	bodyHtml := strings.TrimSpace(req.BodyHtml)
	bodyText := strings.TrimSpace(req.BodyText)
	if bodyText == "" {
		bodyText = bodyHtml
	}

	if !strings.Contains(bodyHtml, "<p>") && !strings.Contains(bodyHtml, "<div>") && !strings.Contains(bodyHtml, "<br") {
		escaped := html.EscapeString(bodyHtml)
		formatted := strings.ReplaceAll(escaped, "\n", "<br/>")
		bodyHtml = fmt.Sprintf(`<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1a1a1a;">%s</div>`, formatted)
	}

	// Send via Brevo API
	msgID, err := services.Email.SendTransactionalEmail(
		c.Request.Context(),
		&setting,
		toEmail,
		toName,
		req.Cc,
		req.Bcc,
		subject,
		bodyHtml,
		bodyText,
		setting.DefaultSenderEmail,
		setting.DefaultSenderName,
		"",
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse(fmt.Sprintf("Gagal mengirim email: %v", err)))
		return
	}

	snippet := bodyText
	if len(snippet) > 120 {
		snippet = snippet[:120] + "..."
	}

	now := time.Now()
	thread := models.EmailThread{
		Subject:       subject,
		Snippet:       snippet,
		LastMessageAt: now,
		MessageCount:  1,
		HasUnread:     false,
		IsStarred:     false,
		IsTrash:       false,
	}
	config.DB.Create(&thread)

	senderEmail := setting.DefaultSenderEmail
	if senderEmail == "" {
		senderEmail = "contact@syahril.dev"
	}
	senderName := setting.DefaultSenderName
	if senderName == "" {
		senderName = "Syahril Haryono"
	}

	emailMsg := models.EmailMessage{
		ThreadID:  thread.ID,
		Direction: "outbound",
		FromEmail: senderEmail,
		FromName:  senderName,
		ToEmail:   toEmail,
		ToName:    toName,
		Cc:        req.Cc,
		Bcc:       req.Bcc,
		Subject:   subject,
		BodyHtml:  bodyHtml,
		BodyText:  bodyText,
		MessageID: msgID,
		Status:    "sent",
		IsRead:    true,
		IsStarred: false,
		IsTrash:   false,
	}
	config.DB.Create(&emailMsg)

	c.JSON(http.StatusCreated, structs.SuccessResponse("Email berhasil dikirim via Brevo", gin.H{
		"thread_id":  thread.ID,
		"message_id": msgID,
	}))
}

func (ctrl *MailboxController) ReplyEmail(c *gin.Context) {
	var req structs.ReplyEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Data balasan tidak valid", nil))
		return
	}

	var thread models.EmailThread
	if err := config.DB.First(&thread, req.ThreadID).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Thread email tidak ditemukan"))
		return
	}

	var lastMsg models.EmailMessage
	config.DB.Where("thread_id = ?", thread.ID).Order("id DESC").First(&lastMsg)

	var setting models.EmailSetting
	config.DB.First(&setting)

	toEmail := lastMsg.FromEmail
	toName := lastMsg.FromName
	if lastMsg.Direction == "outbound" {
		toEmail = lastMsg.ToEmail
		toName = lastMsg.ToName
	}

	replySubject := thread.Subject
	if !strings.HasPrefix(strings.ToLower(replySubject), "re:") {
		replySubject = "Re: " + replySubject
	}

	bodyHtml := strings.TrimSpace(req.BodyHtml)
	bodyText := strings.TrimSpace(req.BodyText)
	if bodyText == "" {
		bodyText = bodyHtml
	}

	if !strings.Contains(bodyHtml, "<p>") && !strings.Contains(bodyHtml, "<div>") && !strings.Contains(bodyHtml, "<br") {
		escaped := html.EscapeString(bodyHtml)
		formatted := strings.ReplaceAll(escaped, "\n", "<br/>")
		bodyHtml = fmt.Sprintf(`<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1a1a1a;">%s</div>`, formatted)
	}

	msgID, err := services.Email.SendTransactionalEmail(
		c.Request.Context(),
		&setting,
		toEmail,
		toName,
		"",
		"",
		replySubject,
		bodyHtml,
		bodyText,
		setting.DefaultSenderEmail,
		setting.DefaultSenderName,
		lastMsg.MessageID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse(fmt.Sprintf("Gagal mengirim balasan: %v", err)))
		return
	}

	snippet := bodyText
	if len(snippet) > 120 {
		snippet = snippet[:120] + "..."
	}

	now := time.Now()
	thread.Snippet = snippet
	thread.LastMessageAt = now
	thread.MessageCount += 1
	thread.HasUnread = false
	thread.IsTrash = false
	config.DB.Save(&thread)

	senderEmail := setting.DefaultSenderEmail
	if senderEmail == "" {
		senderEmail = "contact@syahril.dev"
	}
	senderName := setting.DefaultSenderName
	if senderName == "" {
		senderName = "Syahril Haryono"
	}

	emailMsg := models.EmailMessage{
		ThreadID:  thread.ID,
		Direction: "outbound",
		FromEmail: senderEmail,
		FromName:  senderName,
		ToEmail:   toEmail,
		ToName:    toName,
		Subject:   replySubject,
		BodyHtml:  bodyHtml,
		BodyText:  bodyText,
		MessageID: msgID,
		InReplyTo: lastMsg.MessageID,
		Status:    "sent",
		IsRead:    true,
		IsStarred: false,
		IsTrash:   false,
	}
	config.DB.Create(&emailMsg)

	c.JSON(http.StatusCreated, structs.SuccessResponse("Balasan berhasil dikirim", gin.H{
		"thread_id":  thread.ID,
		"message_id": msgID,
	}))
}

func (ctrl *MailboxController) UpdateThreadStatus(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse("Invalid ID"))
		return
	}

	var thread models.EmailThread
	if err := config.DB.First(&thread, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Thread not found"))
		return
	}

	var req structs.UpdateEmailStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Invalid status data", nil))
		return
	}

	if req.IsRead != nil {
		thread.HasUnread = !*req.IsRead
		config.DB.Model(&models.EmailMessage{}).Where("thread_id = ?", thread.ID).Update("is_read", *req.IsRead)
	}

	if req.IsStarred != nil {
		thread.IsStarred = *req.IsStarred
		config.DB.Model(&models.EmailMessage{}).Where("thread_id = ?", thread.ID).Update("is_starred", *req.IsStarred)
	}

	if req.IsTrash != nil {
		thread.IsTrash = *req.IsTrash
		config.DB.Model(&models.EmailMessage{}).Where("thread_id = ?", thread.ID).Update("is_trash", *req.IsTrash)
	}

	if err := config.DB.Save(&thread).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to update status"))
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse("Status updated", thread))
}

func (ctrl *MailboxController) DeleteThread(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse("Invalid ID"))
		return
	}

	var thread models.EmailThread
	if err := config.DB.First(&thread, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Thread not found"))
		return
	}

	// Delete all messages in thread
	config.DB.Where("thread_id = ?", thread.ID).Delete(&models.EmailMessage{})
	config.DB.Delete(&thread)

	c.JSON(http.StatusOK, structs.SuccessResponse("Thread permanently deleted", nil))
}

func (ctrl *MailboxController) GetMailboxStats(c *gin.Context) {
	var unreadCount int64
	var inboxCount int64
	var sentCount int64
	var starredCount int64
	var trashCount int64

	config.DB.Model(&models.EmailThread{}).Where("is_trash = ? AND has_unread = ? AND id IN (SELECT DISTINCT thread_id FROM email_messages WHERE direction = 'inbound')", false, true).Count(&unreadCount)
	config.DB.Model(&models.EmailThread{}).Where("is_trash = ? AND id IN (SELECT DISTINCT thread_id FROM email_messages WHERE direction = 'inbound')", false).Count(&inboxCount)
	config.DB.Model(&models.EmailThread{}).Where("is_trash = ? AND id IN (SELECT DISTINCT thread_id FROM email_messages WHERE direction = 'outbound')", false).Count(&sentCount)
	config.DB.Model(&models.EmailThread{}).Where("is_trash = ? AND is_starred = ?", false, true).Count(&starredCount)
	config.DB.Model(&models.EmailThread{}).Where("is_trash = ?", true).Count(&trashCount)

	c.JSON(http.StatusOK, structs.SuccessResponse("Mailbox stats", gin.H{
		"unread_count":  unreadCount,
		"inbox_count":   inboxCount,
		"sent_count":    sentCount,
		"starred_count": starredCount,
		"trash_count":   trashCount,
	}))
}

func (ctrl *MailboxController) GetSettings(c *gin.Context) {
	var setting models.EmailSetting
	if err := config.DB.First(&setting).Error; err != nil {
		setting = models.EmailSetting{
			ActiveProvider:     "hybrid",
			DefaultSenderEmail: "contact@arlab.my.id",
			DefaultSenderName:  "Syahril Haryono",
			IsConfigured:       false,
		}
		config.DB.Create(&setting)
	}

	maskedBrevoKey := setting.BrevoAPIKey
	if len(maskedBrevoKey) > 10 {
		maskedBrevoKey = maskedBrevoKey[:6] + "..." + maskedBrevoKey[len(maskedBrevoKey)-4:]
	}

	maskedResendKey := setting.ResendAPIKey
	if len(maskedResendKey) > 10 {
		maskedResendKey = maskedResendKey[:6] + "..." + maskedResendKey[len(maskedResendKey)-4:]
	}

	c.JSON(http.StatusOK, structs.SuccessResponse("Email settings retrieved", gin.H{
		"id":                    setting.ID,
		"active_provider":       setting.ActiveProvider,
		"brevo_api_key":         setting.BrevoAPIKey,
		"brevo_api_key_masked":  maskedBrevoKey,
		"resend_api_key":        setting.ResendAPIKey,
		"resend_api_key_masked": maskedResendKey,
		"default_sender_email":  setting.DefaultSenderEmail,
		"default_sender_name":   setting.DefaultSenderName,
		"inbound_domain":        setting.InboundDomain,
		"is_configured":         setting.BrevoAPIKey != "" || setting.ResendAPIKey != "",
	}))
}

func (ctrl *MailboxController) UpdateSettings(c *gin.Context) {
	var req structs.UpdateEmailSettingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Data pengaturan tidak valid", nil))
		return
	}

	var setting models.EmailSetting
	if err := config.DB.First(&setting).Error; err != nil {
		setting = models.EmailSetting{}
	}

	if req.ActiveProvider != "" {
		setting.ActiveProvider = strings.TrimSpace(req.ActiveProvider)
	}
	if req.BrevoAPIKey != "" && !strings.Contains(req.BrevoAPIKey, "...") {
		setting.BrevoAPIKey = strings.TrimSpace(req.BrevoAPIKey)
	}
	if req.ResendAPIKey != "" && !strings.Contains(req.ResendAPIKey, "...") {
		setting.ResendAPIKey = strings.TrimSpace(req.ResendAPIKey)
	}
	if req.DefaultSenderEmail != "" {
		setting.DefaultSenderEmail = strings.TrimSpace(req.DefaultSenderEmail)
	}
	if req.DefaultSenderName != "" {
		setting.DefaultSenderName = strings.TrimSpace(req.DefaultSenderName)
	}
	if req.InboundDomain != "" {
		setting.InboundDomain = strings.TrimSpace(req.InboundDomain)
	}

	setting.IsConfigured = setting.BrevoAPIKey != "" || setting.ResendAPIKey != ""
	if err := config.DB.Save(&setting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Gagal menyimpan pengaturan email"))
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse("Pengaturan email berhasil diperbarui", setting))
}
