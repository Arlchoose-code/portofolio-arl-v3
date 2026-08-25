package public

import (
	"net/http"

	"portfolio-arl-backend/config"
	"portfolio-arl-backend/models"
	"portfolio-arl-backend/structs"
	"github.com/gin-gonic/gin"
)

type SettingsController struct{}

func NewSettingsController() *SettingsController {
	return &SettingsController{}
}

func (ctrl *SettingsController) GetSiteInfo(c *gin.Context) {
	var site models.SiteSetting
	_ = config.DB.First(&site).Error

	if config.AppConfigInstance != nil && config.AppConfigInstance.Turnstile.Enabled {
		site.TurnstileEnabled = true
		if config.AppConfigInstance.Turnstile.SiteKey != "" {
			site.TurnstileSiteKey = config.AppConfigInstance.Turnstile.SiteKey
		}
	}

	var socials []models.SocialLink
	_ = config.DB.Where("is_active = ?", true).Order("sort_order ASC, id ASC").Find(&socials).Error

	var aiSetting models.AISetting
	_ = config.DB.First(&aiSetting).Error

	response := gin.H{
		"site": site,
		"social_links": socials,
		"chatbot": gin.H{
			"persona_name":        aiSetting.PersonaName,
			"persona_greeting":    aiSetting.PersonaGreeting,
			"persona_language":    aiSetting.PersonaLanguage,
			"persona_description": aiSetting.PersonaDescription,
			"persona_tone":        aiSetting.PersonaTone,
		},
	}

	c.JSON(http.StatusOK, structs.SuccessResponse("Site info retrieved", response))
}
