package public

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"portfolio-arl-backend/config"
	"portfolio-arl-backend/models"
	"portfolio-arl-backend/services"
	"portfolio-arl-backend/structs"
	"github.com/gin-gonic/gin"
)

type EmailWebhookController struct{}

func NewEmailWebhookController() *EmailWebhookController {
	return &EmailWebhookController{}
}

// isAllowedInboundRecipient verifies if the incoming recipient email belongs to a configured sender account
func isAllowedInboundRecipient(toEmail string, setting *models.EmailSetting) bool {
	if setting == nil {
		return true
	}

	target := strings.ToLower(strings.TrimSpace(toEmail))
	if target == "" {
		return false
	}

	// 1. Always allow default sender email account (e.g. contact@arlab.my.id)
	defaultEmail := strings.ToLower(strings.TrimSpace(setting.DefaultSenderEmail))
	if defaultEmail == "" || target == defaultEmail {
		return true
	}

	// 2. Check all configured sender identity accounts
	if setting.CustomSendersJSON != "" {
		var senders []structs.SenderItem
		if err := json.Unmarshal([]byte(setting.CustomSendersJSON), &senders); err == nil {
			for _, s := range senders {
				if strings.EqualFold(strings.TrimSpace(s.Email), target) {
					return true
				}
			}
		}
	}

	return false
}

func (ctrl *EmailWebhookController) HandleBrevoInbound(c *gin.Context) {
	var payload structs.BrevoInboundWebhookPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		log.Printf("[Brevo Inbound Webhook Error] Failed to bind JSON payload: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid webhook payload"})
		return
	}

	var setting models.EmailSetting
	config.DB.First(&setting)

	processedCount := 0
	for _, item := range payload.Items {
		fromEmail := strings.TrimSpace(item.From.Address)
		fromName := strings.TrimSpace(item.From.Name)
		if fromName == "" {
			fromName = strings.Split(fromEmail, "@")[0]
		}

		toEmail := ""
		toName := ""
		if len(item.To) > 0 {
			toEmail = strings.TrimSpace(item.To[0].Address)
			toName = strings.TrimSpace(item.To[0].Name)
		}

		// Strict Account Check: Reject if not an active/allowed account
		if !isAllowedInboundRecipient(toEmail, &setting) {
			log.Printf("[Brevo Inbound REJECTED] Recipient %s is not registered in allowed accounts\n", toEmail)
			continue
		}

		subject := strings.TrimSpace(item.Subject)
		if subject == "" {
			subject = "(Tanpa Subjek)"
		}

		bodyHtml := item.RawHtmlBody
		if bodyHtml == "" {
			bodyHtml = item.ExtractedMarkdownMessage
		}
		bodyText := item.RawTextBody
		if bodyText == "" {
			bodyText = item.ExtractedMarkdownMessage
		}

		snippet := bodyText
		if snippet == "" {
			snippet = item.ExtractedMarkdownMessage
		}
		if len(snippet) > 120 {
			snippet = snippet[:120] + "..."
		}

		// Thread matching: match by InReplyTo or Cleaned Subject
		var thread models.EmailThread
		foundThread := false

		if item.InReplyTo != "" {
			var parentMsg models.EmailMessage
			if err := config.DB.Where("message_id = ?", item.InReplyTo).First(&parentMsg).Error; err == nil {
				if err := config.DB.First(&thread, parentMsg.ThreadID).Error; err == nil {
					foundThread = true
				}
			}
		}

		cleanSubject := strings.TrimPrefix(strings.TrimPrefix(subject, "Re: "), "re: ")
		if !foundThread && cleanSubject != "" {
			if err := config.DB.Where("subject LIKE ? OR subject LIKE ?", cleanSubject, "Re: "+cleanSubject).Order("last_message_at DESC").First(&thread).Error; err == nil {
				foundThread = true
			}
		}

		now := time.Now()
		if !foundThread {
			thread = models.EmailThread{
				Subject:       subject,
				Snippet:       snippet,
				LastMessageAt: now,
				MessageCount:  1,
				HasUnread:     true,
				IsStarred:     false,
				IsTrash:       false,
			}
			config.DB.Create(&thread)
		} else {
			thread.Snippet = snippet
			thread.LastMessageAt = now
			thread.MessageCount += 1
			thread.HasUnread = true
			thread.IsTrash = false
			config.DB.Save(&thread)
		}

		var headersJson string
		if item.Headers != nil {
			if hBytes, err := json.Marshal(item.Headers); err == nil {
				headersJson = string(hBytes)
			}
		}

		emailMsg := models.EmailMessage{
			ThreadID:    thread.ID,
			Direction:   "inbound",
			FromEmail:   fromEmail,
			FromName:    fromName,
			ToEmail:     toEmail,
			ToName:      toName,
			Subject:     subject,
			BodyHtml:    bodyHtml,
			BodyText:    bodyText,
			MessageID:   item.MessageId,
			InReplyTo:   item.InReplyTo,
			HeadersJSON: headersJson,
			Status:      "inbox",
			IsRead:      false,
			IsStarred:   false,
			IsTrash:     false,
		}
		config.DB.Create(&emailMsg)
		processedCount++

		log.Printf("[Brevo Inbound Email Processed] From: %s, To: %s, Subject: %s, Thread ID: %d\n", fromEmail, toEmail, subject, thread.ID)
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "processed_count": processedCount})
}

func (ctrl *EmailWebhookController) HandleResendInbound(c *gin.Context) {
	var payload structs.ResendInboundWebhookPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		log.Printf("[Resend Inbound Webhook Error] Failed to bind JSON payload: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid webhook payload"})
		return
	}

	// Only process email.received events
	if payload.Type != "" && payload.Type != "email.received" {
		c.JSON(http.StatusOK, gin.H{"status": "ignored", "event_type": payload.Type})
		return
	}

	fromRaw := payload.Data.From
	fromName := ""
	fromEmail := fromRaw

	if strings.Contains(fromRaw, "<") && strings.Contains(fromRaw, ">") {
		parts := strings.Split(fromRaw, "<")
		fromName = strings.TrimSpace(parts[0])
		fromEmail = strings.TrimSuffix(strings.TrimSpace(parts[1]), ">")
	}
	if fromName == "" {
		fromName = strings.Split(fromEmail, "@")[0]
	}

	toEmail := ""
	if len(payload.Data.To) > 0 {
		toEmail = payload.Data.To[0]
		if strings.Contains(toEmail, "<") && strings.Contains(toEmail, ">") {
			parts := strings.Split(toEmail, "<")
			toEmail = strings.TrimSuffix(strings.TrimSpace(parts[1]), ">")
		}
	}

	// Fetch settings for account whitelist check
	var setting models.EmailSetting
	config.DB.First(&setting)

	// Strict Account Check: Reject if not an active/allowed account
	if !isAllowedInboundRecipient(toEmail, &setting) {
		log.Printf("[Resend Inbound REJECTED] Recipient %s is not registered in allowed accounts/whitelist\n", toEmail)
		c.JSON(http.StatusOK, gin.H{"status": "rejected", "reason": fmt.Sprintf("Alamat penerima %s tidak terdaftar di akun yang diizinkan", toEmail)})
		return
	}

	subject := strings.TrimSpace(payload.Data.Subject)
	if subject == "" {
		subject = "(Tanpa Subjek)"
	}

	bodyHtml := payload.Data.Html
	bodyText := payload.Data.Text

	// If body is empty, fetch full email via Resend API
	if bodyHtml == "" && bodyText == "" && payload.Data.EmailID != "" {
		if setting.ResendAPIKey != "" {
			details, err := services.Email.FetchResendInboundEmail(c.Request.Context(), setting.ResendAPIKey, payload.Data.EmailID)
			if err == nil && details != nil {
				bodyHtml = details.Html
				bodyText = details.Text
			}
		}
	}

	if bodyText == "" {
		bodyText = bodyHtml
	}
	snippet := bodyText
	if len(snippet) > 120 {
		snippet = snippet[:120] + "..."
	}

	inReplyTo := ""
	if payload.Data.Headers != nil {
		if val, ok := payload.Data.Headers["in-reply-to"]; ok {
			inReplyTo = val
		} else if val, ok := payload.Data.Headers["In-Reply-To"]; ok {
			inReplyTo = val
		}
	}

	// Thread matching: match by InReplyTo or Cleaned Subject
	var thread models.EmailThread
	foundThread := false

	if inReplyTo != "" {
		var parentMsg models.EmailMessage
		if err := config.DB.Where("message_id = ?", inReplyTo).First(&parentMsg).Error; err == nil {
			if err := config.DB.First(&thread, parentMsg.ThreadID).Error; err == nil {
				foundThread = true
			}
		}
	}

	cleanSubject := strings.TrimPrefix(strings.TrimPrefix(subject, "Re: "), "re: ")
	if !foundThread && cleanSubject != "" {
		if err := config.DB.Where("subject LIKE ? OR subject LIKE ?", cleanSubject, "Re: "+cleanSubject).Order("last_message_at DESC").First(&thread).Error; err == nil {
			foundThread = true
		}
	}

	now := time.Now()
	if !foundThread {
		thread = models.EmailThread{
			Subject:       subject,
			Snippet:       snippet,
			LastMessageAt: now,
			MessageCount:  1,
			HasUnread:     true,
			IsStarred:     false,
			IsTrash:       false,
		}
		config.DB.Create(&thread)
	} else {
		thread.Snippet = snippet
		thread.LastMessageAt = now
		thread.MessageCount += 1
		thread.HasUnread = true
		thread.IsTrash = false
		config.DB.Save(&thread)
	}

	msgID := payload.Data.MessageId
	if msgID == "" {
		msgID = payload.Data.EmailID
	}

	var headersJson string
	if payload.Data.Headers != nil {
		if hBytes, err := json.Marshal(payload.Data.Headers); err == nil {
			headersJson = string(hBytes)
		}
	}

	emailMsg := models.EmailMessage{
		ThreadID:    thread.ID,
		Direction:   "inbound",
		FromEmail:   fromEmail,
		FromName:    fromName,
		ToEmail:     toEmail,
		ToName:      "Syahril Haryono",
		Subject:     subject,
		BodyHtml:    bodyHtml,
		BodyText:    bodyText,
		MessageID:   msgID,
		InReplyTo:   inReplyTo,
		HeadersJSON: headersJson,
		Status:      "inbox",
		IsRead:      false,
		IsStarred:   false,
		IsTrash:     false,
	}
	config.DB.Create(&emailMsg)

	log.Printf("[Resend Inbound Email Processed] From: %s, Subject: %s, Thread ID: %d\n", fromEmail, subject, thread.ID)

	c.JSON(http.StatusOK, gin.H{"status": "success", "thread_id": thread.ID})
}
