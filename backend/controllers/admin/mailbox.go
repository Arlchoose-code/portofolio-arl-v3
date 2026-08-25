package admin

import (
	"encoding/json"
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

	// Determine Sender & Reply-To
	senderEmail := strings.TrimSpace(req.SenderEmail)
	senderName := strings.TrimSpace(req.SenderName)
	if senderEmail == "" {
		senderEmail = setting.DefaultSenderEmail
	}
	if senderName == "" {
		senderName = setting.DefaultSenderName
	}
	if senderEmail == "" {
		senderEmail = "contact@arlab.my.id"
	}
	if senderName == "" {
		senderName = "Syahril Haryono"
	}

	replyToEmail := strings.TrimSpace(req.ReplyToEmail)
	if replyToEmail == "" {
		replyToEmail = setting.ReplyToEmail
	}
	replyToName := strings.TrimSpace(req.ReplyToName)
	if replyToName == "" {
		replyToName = setting.ReplyToName
	}

	// Send via Brevo / Resend / Hybrid
	msgID, err := services.Email.SendTransactionalEmailWithSender(
		c.Request.Context(),
		&setting,
		senderEmail,
		senderName,
		toEmail,
		toName,
		req.Cc,
		req.Bcc,
		subject,
		bodyHtml,
		bodyText,
		replyToEmail,
		replyToName,
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

	c.JSON(http.StatusCreated, structs.SuccessResponse("Email berhasil dikirim", gin.H{
		"thread_id":  thread.ID,
		"message_id": msgID,
		"sender":     senderEmail,
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

	// Determine Sender & Reply-To
	senderEmail := strings.TrimSpace(req.SenderEmail)
	senderName := strings.TrimSpace(req.SenderName)
	if senderEmail == "" {
		senderEmail = setting.DefaultSenderEmail
	}
	if senderName == "" {
		senderName = setting.DefaultSenderName
	}
	if senderEmail == "" {
		senderEmail = "contact@arlab.my.id"
	}
	if senderName == "" {
		senderName = "Syahril Haryono"
	}

	replyToEmail := setting.ReplyToEmail
	replyToName := setting.ReplyToName

	msgID, err := services.Email.SendTransactionalEmailWithSender(
		c.Request.Context(),
		&setting,
		senderEmail,
		senderName,
		toEmail,
		toName,
		"",
		"",
		replySubject,
		bodyHtml,
		bodyText,
		replyToEmail,
		replyToName,
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

	c.JSON(http.StatusCreated, structs.SuccessResponse("Balasan email berhasil dikirim", gin.H{
		"thread_id":  thread.ID,
		"message_id": msgID,
		"sender":     senderEmail,
	}))
}

func (ctrl *MailboxController) UpdateThreadStatus(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse("ID thread tidak valid"))
		return
	}

	var req structs.UpdateEmailStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Data status tidak valid", nil))
		return
	}

	var thread models.EmailThread
	if err := config.DB.First(&thread, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Thread tidak ditemukan"))
		return
	}

	updates := map[string]interface{}{}
	if req.IsRead != nil {
		updates["has_unread"] = !*req.IsRead
		config.DB.Model(&models.EmailMessage{}).Where("thread_id = ?", thread.ID).Update("is_read", *req.IsRead)
	}
	if req.IsStarred != nil {
		updates["is_starred"] = *req.IsStarred
	}
	if req.IsTrash != nil {
		updates["is_trash"] = *req.IsTrash
	}

	if len(updates) > 0 {
		config.DB.Model(&thread).Updates(updates)
	}

	c.JSON(http.StatusOK, structs.SuccessResponse("Status thread berhasil diperbarui", thread))
}

func (ctrl *MailboxController) DeleteThread(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse("ID thread tidak valid"))
		return
	}

	var thread models.EmailThread
	if err := config.DB.First(&thread, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Thread tidak ditemukan"))
		return
	}

	config.DB.Where("thread_id = ?", thread.ID).Delete(&models.EmailMessage{})
	config.DB.Delete(&thread)

	c.JSON(http.StatusOK, structs.SuccessResponse("Thread dan seluruh pesannya berhasil dihapus permanen", nil))
}

func (ctrl *MailboxController) GetMailboxStats(c *gin.Context) {
	var inboxCount int64
	var unreadCount int64
	var sentCount int64
	var starredCount int64
	var trashCount int64

	config.DB.Model(&models.EmailThread{}).Where("is_trash = false").Count(&inboxCount)
	config.DB.Model(&models.EmailThread{}).Where("is_trash = false AND has_unread = true").Count(&unreadCount)
	config.DB.Model(&models.EmailMessage{}).Where("direction = 'outbound'").Count(&sentCount)
	config.DB.Model(&models.EmailThread{}).Where("is_trash = false AND is_starred = true").Count(&starredCount)
	config.DB.Model(&models.EmailThread{}).Where("is_trash = true").Count(&trashCount)

	c.JSON(http.StatusOK, structs.SuccessResponse("Mailbox stats retrieved", gin.H{
		"inbox_count":   inboxCount,
		"unread_count":  unreadCount,
		"sent_count":    sentCount,
		"starred_count": starredCount,
		"trash_count":   trashCount,
	}))
}

func (ctrl *MailboxController) GetSenders(c *gin.Context) {
	var setting models.EmailSetting
	config.DB.First(&setting)

	var senders []structs.SenderItem
	if setting.CustomSendersJSON != "" {
		_ = json.Unmarshal([]byte(setting.CustomSendersJSON), &senders)
	}

	if len(senders) == 0 {
		defaultEmail := setting.DefaultSenderEmail
		if defaultEmail == "" {
			defaultEmail = "contact@arlab.my.id"
		}
		defaultName := setting.DefaultSenderName
		if defaultName == "" {
			defaultName = "Syahril Haryono"
		}
		senders = append(senders, structs.SenderItem{
			Email:     defaultEmail,
			Name:      defaultName,
			IsDefault: true,
			Active:    true,
		})
	}

	c.JSON(http.StatusOK, structs.SuccessResponse("Daftar sender berhasil dimuat", gin.H{
		"senders":                senders,
		"default_sender_email":   setting.DefaultSenderEmail,
		"default_sender_name":    setting.DefaultSenderName,
		"reply_to_email":         setting.ReplyToEmail,
		"reply_to_name":          setting.ReplyToName,
		"allowed_inbound_emails": setting.AllowedInboundEmails,
	}))
}

func (ctrl *MailboxController) SyncBrevoSenders(c *gin.Context) {
	var setting models.EmailSetting
	if err := config.DB.First(&setting).Error; err != nil || setting.BrevoAPIKey == "" {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse("API Key Brevo belum dikonfigurasi"))
		return
	}

	senders, err := services.Email.FetchBrevoSenders(c.Request.Context(), setting.BrevoAPIKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse(fmt.Sprintf("Gagal menyinkronkan pengirim dari Brevo: %v", err)))
		return
	}

	for i := range senders {
		if senders[i].Email == setting.DefaultSenderEmail {
			senders[i].IsDefault = true
		}
	}

	sendersBytes, _ := json.Marshal(senders)
	setting.CustomSendersJSON = string(sendersBytes)
	config.DB.Save(&setting)

	c.JSON(http.StatusOK, structs.SuccessResponse(fmt.Sprintf("Berhasil menyinkronkan %d pengirim terverifikasi dari Brevo", len(senders)), gin.H{
		"senders": senders,
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

	var senders []structs.SenderItem
	if setting.CustomSendersJSON != "" {
		_ = json.Unmarshal([]byte(setting.CustomSendersJSON), &senders)
	}

	c.JSON(http.StatusOK, structs.SuccessResponse("Email settings retrieved", gin.H{
		"id":                     setting.ID,
		"active_provider":        setting.ActiveProvider,
		"brevo_api_key":          setting.BrevoAPIKey,
		"brevo_api_key_masked":   maskedBrevoKey,
		"resend_api_key":         setting.ResendAPIKey,
		"resend_api_key_masked":  maskedResendKey,
		"default_sender_email":   setting.DefaultSenderEmail,
		"default_sender_name":    setting.DefaultSenderName,
		"reply_to_email":         setting.ReplyToEmail,
		"reply_to_name":          setting.ReplyToName,
		"custom_senders_json":    setting.CustomSendersJSON,
		"custom_senders":         senders,
		"allowed_inbound_emails": setting.AllowedInboundEmails,
		"inbound_domain":         setting.InboundDomain,
		"is_configured":          setting.BrevoAPIKey != "" || setting.ResendAPIKey != "",
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
	if req.ReplyToEmail != "" {
		setting.ReplyToEmail = strings.TrimSpace(req.ReplyToEmail)
	}
	if req.ReplyToName != "" {
		setting.ReplyToName = strings.TrimSpace(req.ReplyToName)
	}
	if req.CustomSendersJSON != "" {
		setting.CustomSendersJSON = strings.TrimSpace(req.CustomSendersJSON)
	}
	if req.AllowedInboundEmails != "" {
		setting.AllowedInboundEmails = strings.TrimSpace(req.AllowedInboundEmails)
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
