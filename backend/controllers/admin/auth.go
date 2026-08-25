package admin

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
	"time"

	"portfolio-arl-backend/config"
	"portfolio-arl-backend/models"
	"portfolio-arl-backend/services"
	"portfolio-arl-backend/structs"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type AuthController struct {
	cfg *config.Config
}

func NewAuthController(cfg *config.Config) *AuthController {
	return &AuthController{cfg: cfg}
}

func (ctrl *AuthController) Login(c *gin.Context) {
	var req structs.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Invalid request payload", map[string]string{
			"email":    "Valid email is required",
			"password": "Password must be at least 6 characters",
		}))
		return
	}

	clientIP := c.GetHeader("CF-Connecting-IP")
	if clientIP == "" {
		clientIP = c.ClientIP()
	}
	if err := services.Turnstile.VerifyToken(req.TurnstileToken, clientIP); err != nil {
		c.JSON(http.StatusForbidden, structs.ErrorResponse(err.Error()))
		return
	}

	var user models.User
	if err := config.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, structs.ErrorResponse("Invalid email or password"))
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, structs.ErrorResponse("Invalid email or password"))
		return
	}

	accessToken, err := services.Auth.GenerateAccessToken(user.ID, user.Role, ctrl.cfg.JWT.Secret, ctrl.cfg.JWT.AccessExpire)
	if err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to generate access token"))
		return
	}

	refreshToken, err := services.Token.GenerateRefreshToken(user.ID, ctrl.cfg.JWT.RefreshExpire, config.DB)
	if err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to generate refresh token"))
		return
	}

	isSecure := ctrl.cfg.App.Env == "production"
	c.SetSameSite(http.SameSiteLaxMode)

	// Set HttpOnly cookies
	c.SetCookie(
		ctrl.cfg.Cookie.AccessTokenName,
		accessToken,
		int(ctrl.cfg.JWT.AccessExpire.Seconds()),
		"/",
		"",
		isSecure,
		true, // httpOnly
	)

	c.SetCookie(
		ctrl.cfg.Cookie.RefreshTokenName,
		refreshToken,
		int(ctrl.cfg.JWT.RefreshExpire.Seconds()),
		"/",
		"",
		isSecure,
		true, // httpOnly
	)

	userRes := structs.UserResponse{
		ID:    user.ID,
		Name:  user.Name,
		Email: user.Email,
		Role:  user.Role,
	}

	c.JSON(http.StatusOK, structs.SuccessResponse("Login successful", gin.H{
		"user":         userRes,
		"access_token": accessToken,
	}))
}

func (ctrl *AuthController) RefreshToken(c *gin.Context) {
	refreshToken, err := c.Cookie(ctrl.cfg.Cookie.RefreshTokenName)
	if err != nil || refreshToken == "" {
		// Fallback check json body
		var body struct {
			RefreshToken string `json:"refresh_token"`
		}
		_ = c.ShouldBindJSON(&body)
		refreshToken = body.RefreshToken
	}

	if refreshToken == "" {
		c.JSON(http.StatusUnauthorized, structs.ErrorResponse("Refresh token required"))
		return
	}

	pat, err := services.Token.ValidateRefreshToken(refreshToken, config.DB)
	if err != nil {
		c.JSON(http.StatusUnauthorized, structs.ErrorResponse("Invalid or expired refresh token"))
		return
	}

	var user models.User
	if err := config.DB.First(&user, pat.UserID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, structs.ErrorResponse("User not found"))
		return
	}

	// Revoke old refresh token (rotation)
	_ = services.Token.RevokeRefreshToken(refreshToken, config.DB)

	newAccessToken, err := services.Auth.GenerateAccessToken(user.ID, user.Role, ctrl.cfg.JWT.Secret, ctrl.cfg.JWT.AccessExpire)
	if err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to generate access token"))
		return
	}

	newRefreshToken, err := services.Token.GenerateRefreshToken(user.ID, ctrl.cfg.JWT.RefreshExpire, config.DB)
	if err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to generate refresh token"))
		return
	}

	isSecure := ctrl.cfg.App.Env == "production"
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(ctrl.cfg.Cookie.AccessTokenName, newAccessToken, int(ctrl.cfg.JWT.AccessExpire.Seconds()), "/", "", isSecure, true)
	c.SetCookie(ctrl.cfg.Cookie.RefreshTokenName, newRefreshToken, int(ctrl.cfg.JWT.RefreshExpire.Seconds()), "/", "", isSecure, true)

	c.JSON(http.StatusOK, structs.SuccessResponse("Token refreshed successfully", gin.H{
		"access_token": newAccessToken,
	}))
}

func (ctrl *AuthController) Logout(c *gin.Context) {
	refreshToken, _ := c.Cookie(ctrl.cfg.Cookie.RefreshTokenName)
	if refreshToken != "" {
		_ = services.Token.RevokeRefreshToken(refreshToken, config.DB)
	}

	isSecure := ctrl.cfg.App.Env == "production"
	c.SetSameSite(http.SameSiteLaxMode)

	// Clear cookies
	c.SetCookie(ctrl.cfg.Cookie.AccessTokenName, "", -1, "/", "", isSecure, true)
	c.SetCookie(ctrl.cfg.Cookie.RefreshTokenName, "", -1, "/", "", isSecure, true)

	c.JSON(http.StatusOK, structs.SuccessResponse("Logged out successfully", nil))
}

func (ctrl *AuthController) Me(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, structs.ErrorResponse("Unauthorized"))
		return
	}

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("User not found"))
		return
	}

	userRes := structs.UserResponse{
		ID:        user.ID,
		Name:      user.Name,
		Email:     user.Email,
		Role:      user.Role,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}

	c.JSON(http.StatusOK, structs.SuccessResponse("User retrieved successfully", userRes))
}

func (ctrl *AuthController) ForgotPassword(c *gin.Context) {
	var req structs.ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Alamat email tidak valid", nil))
		return
	}

	clientIP := c.GetHeader("CF-Connecting-IP")
	if clientIP == "" {
		clientIP = c.ClientIP()
	}
	if err := services.Turnstile.VerifyToken(req.TurnstileToken, clientIP); err != nil {
		c.JSON(http.StatusForbidden, structs.ErrorResponse(err.Error()))
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))

	var user models.User
	if err := config.DB.Where("email = ?", email).First(&user).Error; err != nil {
		// Generic success response for privacy & security
		c.JSON(http.StatusOK, structs.SuccessResponse("Jika alamat email terdaftar, instruksi reset kata sandi telah dikirimkan ke kotak masuk Anda.", nil))
		return
	}

	// Generate secure random token
	tokenBytes := make([]byte, 32)
	_, _ = rand.Read(tokenBytes)
	resetTokenStr := hex.EncodeToString(tokenBytes)

	resetToken := models.PasswordResetToken{
		Email:     user.Email,
		Token:     resetTokenStr,
		ExpiresAt: time.Now().Add(1 * time.Hour),
		Used:      false,
	}
	config.DB.Create(&resetToken)

	// Fetch email setting
	var setting models.EmailSetting
	config.DB.First(&setting)

	resetLink := fmt.Sprintf("http://localhost:3000/admin/reset-password?token=%s", resetTokenStr)

	// Send password reset email via Brevo
	_ = services.Email.SendPasswordResetEmail(c.Request.Context(), &setting, user.Email, user.Name, resetLink)

	c.JSON(http.StatusOK, structs.SuccessResponse("Instruksi reset kata sandi telah berhasil dikirimkan ke email Anda.", nil))
}

func (ctrl *AuthController) ResetPassword(c *gin.Context) {
	var req structs.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Data reset kata sandi tidak valid", nil))
		return
	}

	tokenStr := strings.TrimSpace(req.Token)
	newPwd := strings.TrimSpace(req.Password)

	if len(newPwd) < 6 {
		c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse("Kata sandi baru minimal 6 karakter."))
		return
	}

	var resetToken models.PasswordResetToken
	if err := config.DB.Where("token = ? AND used = ? AND expires_at > ?", tokenStr, false, time.Now()).First(&resetToken).Error; err != nil {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse("Tautan reset kata sandi tidak valid atau telah kedaluwarsa. Silakan ajukan permintaan baru."))
		return
	}

	var user models.User
	if err := config.DB.Where("email = ?", resetToken.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Akun pengguna tidak ditemukan."))
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPwd), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Gagal mengenkripsi kata sandi baru."))
		return
	}

	user.Password = string(hashedPassword)
	config.DB.Save(&user)

	resetToken.Used = true
	config.DB.Save(&resetToken)

	// Revoke old tokens for safety
	config.DB.Model(&models.PersonalAccessToken{}).Where("user_id = ?", user.ID).Update("revoked", true)

	c.JSON(http.StatusOK, structs.SuccessResponse("Kata sandi berhasil diatur ulang! Silakan login dengan kata sandi baru Anda.", nil))
}
