package structs

type SenderItem struct {
	ID        int    `json:"id,omitempty"`
	Email     string `json:"email"`
	Name      string `json:"name"`
	IsDefault bool   `json:"is_default,omitempty"`
	Active    bool   `json:"active,omitempty"`
}

type EmailAttachment struct {
	Name        string `json:"name"`
	URL         string `json:"url"`
	Size        int64  `json:"size"`
	ContentType string `json:"content_type"`
	ContentB64  string `json:"content_b64,omitempty"`
}

type SendEmailRequest struct {
	SenderEmail  string            `json:"sender_email"`
	SenderName   string            `json:"sender_name"`
	ReplyToEmail string            `json:"reply_to_email"`
	ReplyToName  string            `json:"reply_to_name"`
	ToEmail      string            `json:"to_email" binding:"required,email"`
	ToName       string            `json:"to_name"`
	Cc           string            `json:"cc"`
	Bcc          string            `json:"bcc"`
	Subject      string            `json:"subject" binding:"required,min=1,max=255"`
	BodyHtml     string            `json:"body_html" binding:"required,min=1"`
	BodyText     string            `json:"body_text"`
	Attachments  []EmailAttachment `json:"attachments,omitempty"`
}

type ReplyEmailRequest struct {
	ThreadID    uint              `json:"thread_id" binding:"required"`
	SenderEmail string            `json:"sender_email"`
	SenderName  string            `json:"sender_name"`
	BodyHtml    string            `json:"body_html" binding:"required,min=1"`
	BodyText    string            `json:"body_text"`
	Attachments []EmailAttachment `json:"attachments,omitempty"`
}

type UpdateEmailStatusRequest struct {
	IsRead    *bool `json:"is_read"`
	IsStarred *bool `json:"is_starred"`
	IsTrash   *bool `json:"is_trash"`
}

type UpdateEmailSettingRequest struct {
	ActiveProvider       string `json:"active_provider"` // 'brevo', 'resend', 'hybrid'
	BrevoAPIKey          string `json:"brevo_api_key"`
	ResendAPIKey         string `json:"resend_api_key"`
	DefaultSenderEmail   string `json:"default_sender_email"`
	DefaultSenderName    string `json:"default_sender_name"`
	ReplyToEmail         string `json:"reply_to_email"`
	ReplyToName          string `json:"reply_to_name"`
	CustomSendersJSON    string `json:"custom_senders_json"`
	AllowedInboundEmails string `json:"allowed_inbound_emails"`
	InboundDomain        string `json:"inbound_domain"`
}

// Brevo Inbound Webhook Parsing Schema
type BrevoInboundItem struct {
	Uuid                       any                 `json:"Uuid,omitempty"`
	MessageId                  string              `json:"MessageId,omitempty"`
	InReplyTo                  string              `json:"InReplyTo,omitempty"`
	Subject                    string              `json:"Subject,omitempty"`
	ExtractedMarkdownMessage   string              `json:"ExtractedMarkdownMessage,omitempty"`
	ExtractedMarkdownSignature string              `json:"ExtractedMarkdownSignature,omitempty"`
	RawHtmlBody                string              `json:"RawHtmlBody,omitempty"`
	RawTextBody                string              `json:"RawTextBody,omitempty"`
	From                       BrevoEmailAddress   `json:"From,omitempty"`
	To                         []BrevoEmailAddress `json:"To,omitempty"`
	Cc                         []BrevoEmailAddress `json:"Cc,omitempty"`
	Headers                    any                 `json:"Headers,omitempty"`
}

type BrevoEmailAddress struct {
	Address string `json:"Address"`
	Name    string `json:"Name,omitempty"`
}

type BrevoInboundWebhookPayload struct {
	Items []BrevoInboundItem `json:"items"`
}

// Resend Inbound Webhook Parsing Schema
type ResendInboundWebhookPayload struct {
	Type      string            `json:"type"` // "email.received"
	CreatedAt string            `json:"created_at"`
	Data      ResendInboundData `json:"data"`
}

type ResendInboundData struct {
	EmailID   string            `json:"email_id"`
	From      string            `json:"from"`
	To        []string          `json:"to"`
	Cc        []string          `json:"cc,omitempty"`
	Bcc       []string          `json:"bcc,omitempty"`
	Subject   string            `json:"subject"`
	Html      string            `json:"html,omitempty"`
	Text      string            `json:"text,omitempty"`
	MessageId string            `json:"message_id,omitempty"`
	Headers   map[string]string `json:"headers,omitempty"`
}

type ResendEmailDetails struct {
	ID        string            `json:"id"`
	From      string            `json:"from"`
	To        []string          `json:"to"`
	Subject   string            `json:"subject"`
	Html      string            `json:"html"`
	Text      string            `json:"text"`
	CreatedAt string            `json:"created_at"`
	Headers   map[string]string `json:"headers,omitempty"`
}
