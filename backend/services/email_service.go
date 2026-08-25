package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"portfolio-arl-backend/models"
	"portfolio-arl-backend/structs"
)

type EmailService struct {
	client *http.Client
}

var Email = &EmailService{
	client: &http.Client{
		Timeout: 20 * time.Second,
	},
}

type BrevoRecipient struct {
	Email string `json:"email"`
	Name  string `json:"name,omitempty"`
}

type BrevoSender struct {
	Email string `json:"email"`
	Name  string `json:"name,omitempty"`
}

type BrevoAttachmentItem struct {
	URL     string `json:"url,omitempty"`
	Content string `json:"content,omitempty"` // base64
	Name    string `json:"name"`
}

type BrevoSendEmailRequest struct {
	Sender      BrevoSender           `json:"sender"`
	To          []BrevoRecipient      `json:"to"`
	Cc          []BrevoRecipient      `json:"cc,omitempty"`
	Bcc         []BrevoRecipient      `json:"bcc,omitempty"`
	ReplyTo     *BrevoSender          `json:"replyTo,omitempty"`
	Subject     string                `json:"subject"`
	HtmlContent string                `json:"htmlContent"`
	TextContent string                `json:"textContent,omitempty"`
	Attachment  []BrevoAttachmentItem `json:"attachment,omitempty"`
	Headers     map[string]string     `json:"headers,omitempty"`
}

type BrevoSendEmailResponse struct {
	MessageID string `json:"messageId"`
	Code      string `json:"code,omitempty"`
	Message   string `json:"message,omitempty"`
}

type ResendAttachmentItem struct {
	Content  string `json:"content,omitempty"`
	Filename string `json:"filename"`
	Path     string `json:"path,omitempty"`
}

type ResendSendEmailRequest struct {
	From        string                 `json:"from"`
	To          []string               `json:"to"`
	Cc          []string               `json:"cc,omitempty"`
	Bcc         []string               `json:"bcc,omitempty"`
	ReplyTo     string                 `json:"reply_to,omitempty"`
	Subject     string                 `json:"subject"`
	Html        string                 `json:"html"`
	Text        string                 `json:"text,omitempty"`
	Attachments []ResendAttachmentItem `json:"attachments,omitempty"`
	Headers     map[string]string      `json:"headers,omitempty"`
}

type ResendSendEmailResponse struct {
	ID      string `json:"id"`
	Name    string `json:"name,omitempty"`
	Message string `json:"message,omitempty"`
}

// FormatGmailQuotedReply formats an HTML reply with standard Gmail-style quoted block and header
func (s *EmailService) FormatGmailQuotedReply(replyHtml, originalHtml, originalDateStr, originalFromName, originalFromEmail string) string {
	if strings.TrimSpace(originalHtml) == "" {
		return replyHtml
	}
	header := fmt.Sprintf("Pada %s %s &lt;%s&gt; menulis:", originalDateStr, originalFromName, originalFromEmail)
	return fmt.Sprintf(`<div>%s</div><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">%s</div><blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid #ccc;padding-left:1ex">%s</blockquote></div>`, replyHtml, header, originalHtml)
}

// SendViaBrevo sends email via Brevo REST API v3
func (s *EmailService) SendViaBrevo(
	ctx context.Context,
	apiKey, fromEmail, fromName, toEmail, toName, cc, bcc, subject, htmlBody, textBody, replyToEmail, replyToName, inReplyToMsgId string,
	attachments []structs.EmailAttachment,
) (string, error) {
	reqPayload := BrevoSendEmailRequest{
		Sender: BrevoSender{
			Email: fromEmail,
			Name:  fromName,
		},
		To: []BrevoRecipient{
			{
				Email: toEmail,
				Name:  toName,
			},
		},
		Subject:     subject,
		HtmlContent: htmlBody,
		TextContent: textBody,
	}

	for _, att := range attachments {
		if att.ContentB64 != "" {
			reqPayload.Attachment = append(reqPayload.Attachment, BrevoAttachmentItem{
				Name:    att.Name,
				Content: att.ContentB64,
			})
		} else if att.URL != "" {
			reqPayload.Attachment = append(reqPayload.Attachment, BrevoAttachmentItem{
				Name: att.Name,
				URL:  att.URL,
			})
		}
	}

	if cc != "" {
		for _, c := range strings.Split(cc, ",") {
			cTrim := strings.TrimSpace(c)
			if cTrim != "" {
				reqPayload.Cc = append(reqPayload.Cc, BrevoRecipient{Email: cTrim})
			}
		}
	}

	if bcc != "" {
		for _, b := range strings.Split(bcc, ",") {
			bTrim := strings.TrimSpace(b)
			if bTrim != "" {
				reqPayload.Bcc = append(reqPayload.Bcc, BrevoRecipient{Email: bTrim})
			}
		}
	}

	if replyToEmail != "" {
		reqPayload.ReplyTo = &BrevoSender{
			Email: replyToEmail,
			Name:  replyToName,
		}
	}

	if inReplyToMsgId != "" {
		reqPayload.Headers = map[string]string{
			"In-Reply-To": inReplyToMsgId,
			"References":  inReplyToMsgId,
		}
	}

	bodyBytes, err := json.Marshal(reqPayload)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.brevo.com/v3/smtp/email", bytes.NewBuffer(bodyBytes))
	if err != nil {
		return "", err
	}

	req.Header.Set("accept", "application/json")
	req.Header.Set("api-key", strings.TrimSpace(apiKey))
	req.Header.Set("content-type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("gagal terhubung ke server Brevo: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("gagal membaca respon Brevo: %w", err)
	}

	if resp.StatusCode >= 400 {
		var brevoErr BrevoSendEmailResponse
		_ = json.Unmarshal(respBytes, &brevoErr)
		if resp.StatusCode == 401 {
			return "", fmt.Errorf("API Key Brevo tidak valid atau salah (%s). Pastikan mengambil key dari tab 'API Keys' (diawali xkeysib-), BUKAN dari tab SMTP", brevoErr.Message)
		}
		if resp.StatusCode == 400 && strings.Contains(strings.ToLower(brevoErr.Message), "sender") {
			return "", fmt.Errorf("Email pengirim belum diverifikasi di Brevo: %s. Daftarkan email pengirim di menu Senders & IPs pada dashboard Brevo", brevoErr.Message)
		}
		return "", fmt.Errorf("Brevo error (%d): %s %s", resp.StatusCode, brevoErr.Code, brevoErr.Message)
	}

	var brevoResp BrevoSendEmailResponse
	if err := json.Unmarshal(respBytes, &brevoResp); err != nil {
		return "", fmt.Errorf("gagal mem-parsing id pesan Brevo: %w", err)
	}

	return brevoResp.MessageID, nil
}

// SendViaResend sends email via Resend REST API
func (s *EmailService) SendViaResend(
	ctx context.Context,
	apiKey, fromEmail, fromName, toEmail, toName, cc, bcc, subject, htmlBody, textBody, replyToEmail, inReplyToMsgId string,
	attachments []structs.EmailAttachment,
) (string, error) {
	fromFormatted := fmt.Sprintf("%s <%s>", fromName, fromEmail)
	if fromName == "" {
		fromFormatted = fromEmail
	}

	reqPayload := ResendSendEmailRequest{
		From:    fromFormatted,
		To:      []string{toEmail},
		Subject: subject,
		Html:    htmlBody,
		Text:    textBody,
	}

	for _, att := range attachments {
		if att.ContentB64 != "" {
			reqPayload.Attachments = append(reqPayload.Attachments, ResendAttachmentItem{
				Filename: att.Name,
				Content:  att.ContentB64,
			})
		} else if att.URL != "" {
			reqPayload.Attachments = append(reqPayload.Attachments, ResendAttachmentItem{
				Filename: att.Name,
				Path:     att.URL,
			})
		}
	}

	if cc != "" {
		for _, c := range strings.Split(cc, ",") {
			cTrim := strings.TrimSpace(c)
			if cTrim != "" {
				reqPayload.Cc = append(reqPayload.Cc, cTrim)
			}
		}
	}

	if bcc != "" {
		for _, b := range strings.Split(bcc, ",") {
			bTrim := strings.TrimSpace(b)
			if bTrim != "" {
				reqPayload.Bcc = append(reqPayload.Bcc, bTrim)
			}
		}
	}

	if replyToEmail != "" {
		reqPayload.ReplyTo = replyToEmail
	}

	if inReplyToMsgId != "" {
		reqPayload.Headers = map[string]string{
			"In-Reply-To": inReplyToMsgId,
			"References":  inReplyToMsgId,
		}
	}

	bodyBytes, err := json.Marshal(reqPayload)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.resend.com/emails", bytes.NewBuffer(bodyBytes))
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+strings.TrimSpace(apiKey))
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("gagal terhubung ke server Resend: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("gagal membaca respon Resend: %w", err)
	}

	if resp.StatusCode >= 400 {
		var resendErr ResendSendEmailResponse
		_ = json.Unmarshal(respBytes, &resendErr)
		return "", fmt.Errorf("Resend error (%d): %s", resp.StatusCode, resendErr.Message)
	}

	var resendResp ResendSendEmailResponse
	if err := json.Unmarshal(respBytes, &resendResp); err != nil {
		return "", fmt.Errorf("gagal mem-parsing id pesan Resend: %w", err)
	}

	return resendResp.ID, nil
}

// FetchResendInboundEmail fetches full email content from Resend Receiving API
func (s *EmailService) FetchResendInboundEmail(ctx context.Context, apiKey, emailID string) (*structs.ResendEmailDetails, error) {
	if apiKey == "" || emailID == "" {
		return nil, fmt.Errorf("missing apiKey or emailID")
	}

	url := fmt.Sprintf("https://api.resend.com/emails/receiving/%s", emailID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+strings.TrimSpace(apiKey))

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("Resend fetch error (%d): %s", resp.StatusCode, string(respBytes))
	}

	var details structs.ResendEmailDetails
	if err := json.Unmarshal(respBytes, &details); err != nil {
		return nil, err
	}

	return &details, nil
}

// FetchBrevoSenders fetches verified sender identities from Brevo account
type BrevoSendersResponse struct {
	Senders []struct {
		ID     int    `json:"id"`
		Name   string `json:"name"`
		Email  string `json:"email"`
		Active bool   `json:"active"`
	} `json:"senders"`
}

func (s *EmailService) FetchBrevoSenders(ctx context.Context, apiKey string) ([]structs.SenderItem, error) {
	if apiKey == "" {
		return nil, fmt.Errorf("kunci API Brevo tidak boleh kosong")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://api.brevo.com/v3/senders", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("api-key", strings.TrimSpace(apiKey))
	req.Header.Set("accept", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("Brevo API error (%d): %s", resp.StatusCode, string(bodyBytes))
	}

	var res BrevoSendersResponse
	if err := json.Unmarshal(bodyBytes, &res); err != nil {
		return nil, err
	}

	var senders []structs.SenderItem
	for _, s := range res.Senders {
		senders = append(senders, structs.SenderItem{
			ID:     s.ID,
			Email:  s.Email,
			Name:   s.Name,
			Active: s.Active,
		})
	}

	return senders, nil
}

// CreateBrevoSender creates a new verified sender identity in Brevo account
func (s *EmailService) CreateBrevoSender(ctx context.Context, apiKey, name, email string) (*structs.SenderItem, error) {
	if apiKey == "" {
		return nil, fmt.Errorf("kunci API Brevo tidak boleh kosong")
	}

	payload := map[string]string{
		"name":  strings.TrimSpace(name),
		"email": strings.TrimSpace(email),
	}
	payloadBytes, _ := json.Marshal(payload)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.brevo.com/v3/senders", bytes.NewReader(payloadBytes))
	if err != nil {
		return nil, err
	}
	req.Header.Set("api-key", strings.TrimSpace(apiKey))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("accept", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBytes, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("Brevo API error (%d): %s", resp.StatusCode, string(respBytes))
	}

	var createResp struct {
		ID int `json:"id"`
	}
	_ = json.Unmarshal(respBytes, &createResp)

	return &structs.SenderItem{
		ID:     createResp.ID,
		Name:   name,
		Email:  email,
		Active: true,
	}, nil
}

// DeleteBrevoSender deletes a sender identity from Brevo account
func (s *EmailService) DeleteBrevoSender(ctx context.Context, apiKey string, senderID int) error {
	if apiKey == "" || senderID <= 0 {
		return nil
	}

	url := fmt.Sprintf("https://api.brevo.com/v3/senders/%d", senderID)
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("api-key", strings.TrimSpace(apiKey))
	req.Header.Set("accept", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 && resp.StatusCode != http.StatusNotFound {
		respBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("Brevo delete error (%d): %s", resp.StatusCode, string(respBytes))
	}

	return nil
}

// SendTransactionalEmail orchestrates sending via Brevo, Resend, or Hybrid fallback
func (s *EmailService) SendTransactionalEmail(
	ctx context.Context,
	setting *models.EmailSetting,
	toEmail, toName, cc, bcc, subject, htmlBody, textBody, replyToEmail, replyToName string,
	inReplyToMsgId string,
) (string, error) {
	return s.SendTransactionalEmailWithSender(
		ctx,
		setting,
		"",
		"",
		toEmail,
		toName,
		cc,
		bcc,
		subject,
		htmlBody,
		textBody,
		replyToEmail,
		replyToName,
		inReplyToMsgId,
	)
}

// SendTransactionalEmailWithSender allows explicit sender overrides
func (s *EmailService) SendTransactionalEmailWithSender(
	ctx context.Context,
	setting *models.EmailSetting,
	customSenderEmail, customSenderName string,
	toEmail, toName, cc, bcc, subject, htmlBody, textBody, replyToEmail, replyToName string,
	inReplyToMsgId string,
) (string, error) {
	return s.SendTransactionalEmailWithSenderAndAttachments(
		ctx,
		setting,
		customSenderEmail,
		customSenderName,
		toEmail,
		toName,
		cc,
		bcc,
		subject,
		htmlBody,
		textBody,
		replyToEmail,
		replyToName,
		inReplyToMsgId,
		nil,
	)
}

// SendTransactionalEmailWithSenderAndAttachments allows explicit sender overrides and attachments
func (s *EmailService) SendTransactionalEmailWithSenderAndAttachments(
	ctx context.Context,
	setting *models.EmailSetting,
	customSenderEmail, customSenderName string,
	toEmail, toName, cc, bcc, subject, htmlBody, textBody, replyToEmail, replyToName string,
	inReplyToMsgId string,
	attachments []structs.EmailAttachment,
) (string, error) {
	senderEmail := "contact@arlab.my.id"
	senderName := "Syahril Haryono"
	provider := "hybrid"
	brevoKey := ""
	resendKey := ""

	if setting != nil {
		if setting.DefaultSenderEmail != "" {
			senderEmail = setting.DefaultSenderEmail
		}
		if setting.DefaultSenderName != "" {
			senderName = setting.DefaultSenderName
		}
		if setting.ActiveProvider != "" {
			provider = setting.ActiveProvider
		}
		brevoKey = strings.TrimSpace(setting.BrevoAPIKey)
		resendKey = strings.TrimSpace(setting.ResendAPIKey)
	}

	if strings.TrimSpace(customSenderEmail) != "" {
		senderEmail = strings.TrimSpace(customSenderEmail)
	}
	if strings.TrimSpace(customSenderName) != "" {
		senderName = strings.TrimSpace(customSenderName)
	}

	// Dev simulation if no keys configured
	if brevoKey == "" && resendKey == "" {
		simulatedID := fmt.Sprintf("<simulated-%d@portfolio.local>", time.Now().UnixNano())
		log.Printf("[EmailService DEV SIMULATION] From: %s <%s>, To: %s, Subject: %s (No Email API Key configured, Attachments: %d)\n", senderName, senderEmail, toEmail, subject, len(attachments))
		return simulatedID, nil
	}

	// Resend Only
	if provider == "resend" && resendKey != "" {
		return s.SendViaResend(ctx, resendKey, senderEmail, senderName, toEmail, toName, cc, bcc, subject, htmlBody, textBody, replyToEmail, inReplyToMsgId, attachments)
	}

	// Brevo Only
	if provider == "brevo" && brevoKey != "" {
		return s.SendViaBrevo(ctx, brevoKey, senderEmail, senderName, toEmail, toName, cc, bcc, subject, htmlBody, textBody, replyToEmail, replyToName, inReplyToMsgId, attachments)
	}

	// Hybrid Mode: Try Brevo first (300/day limit), then fallback to Resend (100/day limit)
	if brevoKey != "" {
		msgID, err := s.SendViaBrevo(ctx, brevoKey, senderEmail, senderName, toEmail, toName, cc, bcc, subject, htmlBody, textBody, replyToEmail, replyToName, inReplyToMsgId, attachments)
		if err == nil {
			return msgID, nil
		}
		log.Printf("[Hybrid Email Warning] Brevo failed (%v), attempting Resend fallback...\n", err)
		if resendKey != "" {
			return s.SendViaResend(ctx, resendKey, senderEmail, senderName, toEmail, toName, cc, bcc, subject, htmlBody, textBody, replyToEmail, inReplyToMsgId, attachments)
		}
		return "", err
	}

	if resendKey != "" {
		return s.SendViaResend(ctx, resendKey, senderEmail, senderName, toEmail, toName, cc, bcc, subject, htmlBody, textBody, replyToEmail, inReplyToMsgId, attachments)
	}

	return "", fmt.Errorf("tidak ada provider email yang aktif atau terkonfigurasi")
}

// SendPasswordResetEmail sends branded HTML password reset link
func (s *EmailService) SendPasswordResetEmail(
	ctx context.Context,
	setting *models.EmailSetting,
	toEmail, toName, resetLink string,
) error {
	subject := "Reset Kata Sandi Admin Portal - Syahril Haryono"

	htmlBody := fmt.Sprintf(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Kata Sandi</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #f8fafc; }
    .container { max-width: 520px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
    .brand { font-size: 20px; font-weight: 800; color: #c084fc; margin-bottom: 24px; display: inline-block; }
    .title { font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 24px; }
    .btn { display: inline-block; background-color: #84cc16; color: #0f172a; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 10px; text-decoration: none; text-align: center; margin-bottom: 24px; }
    .btn:hover { background-color: #a3e635; }
    .footer { font-size: 12px; color: #64748b; border-top: 1px solid #334155; padding-top: 20px; margin-top: 24px; line-height: 1.5; }
    .link-alt { word-break: break-all; color: #38bdf8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">Syahril Haryono • Admin Panel</div>
    <div class="title">Permintaan Reset Kata Sandi</div>
    <p class="text">Halo <strong>%s</strong>,<br>Kami menerima permintaan untuk mengatur ulang kata sandi akun Admin Portal Anda. Klik tombol di bawah untuk melanjutkan:</p>
    
    <div style="text-align: center;">
      <a href="%s" class="btn" target="_blank">Reset Kata Sandi Sekarang</a>
    </div>

    <p class="text" style="font-size: 12px;">Link reset ini hanya berlaku selama <strong>1 jam</strong>. Jika Anda tidak merasa meminta reset kata sandi, abaikan email ini dan akun Anda tetap aman.</p>
    
    <div class="footer">
      Jika tombol di atas tidak berfungsi, salin dan buka tautan berikut di browser Anda:<br>
      <a href="%s" class="link-alt">%s</a>
      <br><br>
      &copy; 2026 Syahril Haryono Portfolio. All rights reserved.
    </div>
  </div>
</body>
</html>`, toName, resetLink, resetLink, resetLink)

	textBody := fmt.Sprintf("Halo %s,\n\nKami menerima permintaan untuk mengatur ulang kata sandi akun Admin Portal Anda. Buka tautan berikut untuk membuat kata sandi baru:\n\n%s\n\nTautan berlaku selama 1 jam.", toName, resetLink)

	_, err := s.SendTransactionalEmail(
		ctx,
		setting,
		toEmail,
		toName,
		"",
		"",
		subject,
		htmlBody,
		textBody,
		"",
		"",
		"",
	)
	return err
}
