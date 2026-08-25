package services

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"time"

	"portfolio-arl-backend/models"
	"gorm.io/gorm"
)

type TokenService struct{}

var Token = &TokenService{}

func (s *TokenService) GenerateRefreshToken(userID uint, expire time.Duration, db *gorm.DB) (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	rawToken := hex.EncodeToString(bytes)
	tokenHash := s.hashToken(rawToken)

	pat := models.PersonalAccessToken{
		UserID:    userID,
		TokenHash: tokenHash,
		Token:     rawToken,
		ExpiresAt: time.Now().Add(expire),
		Revoked:   false,
	}

	if err := db.Create(&pat).Error; err != nil {
		return "", err
	}

	return rawToken, nil
}

func (s *TokenService) ValidateRefreshToken(rawToken string, db *gorm.DB) (*models.PersonalAccessToken, error) {
	tokenHash := s.hashToken(rawToken)

	var pat models.PersonalAccessToken
	if err := db.Where("token_hash = ? AND revoked = ?", tokenHash, false).First(&pat).Error; err != nil {
		return nil, errors.New("refresh token not found or revoked")
	}

	if time.Now().After(pat.ExpiresAt) {
		pat.Revoked = true
		db.Save(&pat)
		return nil, errors.New("refresh token expired")
	}

	return &pat, nil
}

func (s *TokenService) RevokeRefreshToken(rawToken string, db *gorm.DB) error {
	tokenHash := s.hashToken(rawToken)
	return db.Model(&models.PersonalAccessToken{}).
		Where("token_hash = ?", tokenHash).
		Update("revoked", true).Error
}

func (s *TokenService) RevokeAllUserTokens(userID uint, db *gorm.DB) error {
	return db.Model(&models.PersonalAccessToken{}).
		Where("user_id = ?", userID).
		Update("revoked", true).Error
}

func (s *TokenService) hashToken(raw string) string {
	hasher := sha256.New()
	hasher.Write([]byte(raw))
	return hex.EncodeToString(hasher.Sum(nil))
}
