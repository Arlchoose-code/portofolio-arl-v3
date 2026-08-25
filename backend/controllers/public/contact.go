package public

import (
	"net/http"
	"net/mail"
	"strings"
	"time"

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

func (ctrl *ContactController) SubmitContact(c *gin.Context) {
	var req structs.CreateContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Format formulir tidak valid", nil))
		return
	}

	// Anti-Spam Honeypot Bot Trap: If hidden bot field is filled, silently discard without DB pollution
	if strings.TrimSpace(req.Honeypot) != "" {
		c.JSON(http.StatusCreated, structs.SuccessResponse("Pesan Anda berhasil dikirim! Terima kasih telah menghubungi saya.", gin.H{
			"id":         0,
			"created_at": time.Now(),
		}))
		return
	}

	name := strings.TrimSpace(req.Name)
	email := strings.TrimSpace(req.Email)
	subject := strings.TrimSpace(req.Subject)
	message := strings.TrimSpace(req.Message)

	errorsMap := make(map[string]string)

	// Validate Name
	if name == "" {
		errorsMap["name"] = "Nama lengkap wajib diisi."
	} else if len(name) < 2 {
		errorsMap["name"] = "Nama lengkap minimal 2 karakter."
	} else if len(name) > 100 {
		errorsMap["name"] = "Nama lengkap maksimal 100 karakter."
	}

	// Validate Email
	if email == "" {
		errorsMap["email"] = "Alamat email wajib diisi."
	} else if _, err := mail.ParseAddress(email); err != nil || !strings.Contains(email, ".") {
		errorsMap["email"] = "Format alamat email tidak valid (contoh: nama@domain.com)."
	} else if len(email) > 150 {
		errorsMap["email"] = "Alamat email maksimal 150 karakter."
	}

	// Validate Subject
	if len(subject) > 200 {
		errorsMap["subject"] = "Subjek pesan maksimal 200 karakter."
	}

	// Validate Message
	if message == "" {
		errorsMap["message"] = "Pesan wajib diisi."
	} else if len(message) < 10 {
		errorsMap["message"] = "Pesan terlalu singkat, minimal 10 karakter agar maksud Anda dapat dipahami dengan baik."
	} else if len(message) > 5000 {
		errorsMap["message"] = "Pesan maksimal 5.000 karakter."
	}

	if len(errorsMap) > 0 {
		var firstErr string
		for _, msg := range errorsMap {
			firstErr = msg
			break
		}
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse(firstErr, errorsMap))
		return
	}

	// Detect client IP with fallback for reverse proxies (Cloudflare, Nginx, Vercel)
	clientIP := c.GetHeader("CF-Connecting-IP")
	if clientIP == "" {
		clientIP = c.GetHeader("X-Forwarded-For")
		if clientIP != "" && strings.Contains(clientIP, ",") {
			clientIP = strings.TrimSpace(strings.Split(clientIP, ",")[0])
		}
	}
	if clientIP == "" {
		clientIP = c.GetHeader("X-Real-IP")
	}
	if clientIP == "" {
		clientIP = c.ClientIP()
	}

	// Verify Cloudflare Turnstile token
	if err := services.Turnstile.VerifyToken(req.TurnstileToken, clientIP); err != nil {
		c.JSON(http.StatusForbidden, structs.ErrorResponse(err.Error()))
		return
	}

	// Rate limit: max 5 messages per IP per hour
	var recentCount int64
	oneHourAgo := time.Now().Add(-1 * time.Hour)
	config.DB.Model(&models.ContactMessage{}).
		Where("ip_address = ? AND created_at >= ?", clientIP, oneHourAgo).
		Count(&recentCount)

	if recentCount >= 5 {
		c.JSON(http.StatusTooManyRequests, structs.ErrorResponse("Anda telah mengirimkan terlalu banyak pesan dalam 1 jam terakhir. Silakan tunggu beberapa saat."))
		return
	}

	contactMsg := models.ContactMessage{
		Name:      name,
		Email:     email,
		Subject:   subject,
		Message:   message,
		IPAddress: clientIP,
		UserAgent: c.GetHeader("User-Agent"),
		IsRead:    false,
		Status:    "unread",
	}

	if err := config.DB.Create(&contactMsg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Gagal mengirimkan pesan. Silakan coba lagi."))
		return
	}

	c.JSON(http.StatusCreated, structs.SuccessResponse("Pesan Anda berhasil dikirim! Terima kasih telah menghubungi saya.", gin.H{
		"id":         contactMsg.ID,
		"created_at": contactMsg.CreatedAt,
	}))
}
