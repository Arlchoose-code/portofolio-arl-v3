package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"portfolio-arl-backend/config"
	"portfolio-arl-backend/models"
)

type TurnstileService struct {
	client *http.Client
}

var Turnstile = &TurnstileService{
	client: &http.Client{Timeout: 6 * time.Second},
}

type TurnstileVerifyResponse struct {
	Success     bool     `json:"success"`
	ErrorCodes  []string `json:"error-codes"`
	ChallengeTS string   `json:"challenge_ts"`
	Hostname    string   `json:"hostname"`
}

// VerifyToken verifies a Cloudflare Turnstile token.
// Checks .env configuration first, then falls back to database site_settings.
func (s *TurnstileService) VerifyToken(token string, clientIP string) error {
	enabled := false
	secretKey := ""

	// 1. Check .env configuration
	if config.AppConfigInstance != nil && config.AppConfigInstance.Turnstile.Enabled {
		enabled = true
		secretKey = config.AppConfigInstance.Turnstile.SecretKey
	}

	// 2. If not enabled in .env, check database site_settings
	if !enabled || secretKey == "" {
		var siteSetting models.SiteSetting
		if err := config.DB.First(&siteSetting).Error; err == nil {
			if siteSetting.TurnstileEnabled && strings.TrimSpace(siteSetting.TurnstileSecretKey) != "" {
				enabled = true
				secretKey = siteSetting.TurnstileSecretKey
			}
		}
	}

	// If Turnstile is disabled or no secret key configured, bypass verification
	if !enabled || strings.TrimSpace(secretKey) == "" {
		return nil
	}

	trimmedToken := strings.TrimSpace(token)
	if trimmedToken == "" {
		return fmt.Errorf("Verifikasi keamanan Cloudflare Turnstile wajib diselesaikan.")
	}

	formData := url.Values{
		"secret":   {secretKey},
		"response": {trimmedToken},
	}
	if clientIP != "" {
		formData.Set("remoteip", clientIP)
	}

	resp, err := s.client.PostForm("https://challenges.cloudflare.com/turnstile/v0/siteverify", formData)
	if err != nil {
		// Log network error and allow graceful fail if Cloudflare is temporarily unreachable
		return fmt.Errorf("Gagal menghubungi server verifikasi keamanan Cloudflare: %w", err)
	}
	defer resp.Body.Close()

	var verifyRes TurnstileVerifyResponse
	if err := json.NewDecoder(resp.Body).Decode(&verifyRes); err != nil {
		return fmt.Errorf("Format respon verifikasi keamanan tidak valid")
	}

	if !verifyRes.Success {
		return fmt.Errorf("Verifikasi keamanan Cloudflare Turnstile gagal (Bot terdeteksi).")
	}

	return nil
}
