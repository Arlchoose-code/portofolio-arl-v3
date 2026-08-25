package admin

import (
	"net/http"

	"portfolio-arl-backend/config"
	"portfolio-arl-backend/models"
	"portfolio-arl-backend/services"
	"portfolio-arl-backend/structs"
	"github.com/gin-gonic/gin"
)

type SiteSettingController struct{}

func NewSiteSettingController() *SiteSettingController {
	return &SiteSettingController{}
}

func (ctrl *SiteSettingController) GetSiteSetting(c *gin.Context) {
	var setting models.SiteSetting
	if err := config.DB.First(&setting).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Site setting not found"))
		return
	}
	c.JSON(http.StatusOK, structs.SuccessResponse("Site setting retrieved", setting))
}

func (ctrl *SiteSettingController) UpdateSiteSetting(c *gin.Context) {
	var req structs.UpdateSiteSettingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Invalid site setting data", nil))
		return
	}

	var setting models.SiteSetting
	if err := config.DB.First(&setting).Error; err != nil {
		setting = models.SiteSetting{}
	}

	setting.SiteName = req.SiteName
	if req.TitleSeparator != "" {
		setting.TitleSeparator = req.TitleSeparator
	} else if setting.TitleSeparator == "" {
		setting.TitleSeparator = "|"
	}
	setting.Tagline = req.Tagline
	setting.Description = req.Description
	setting.LogoURL = req.LogoURL
	setting.HeroBackgroundURL = req.HeroBackgroundURL
	setting.FaviconURL = req.FaviconURL
	setting.FooterText = req.FooterText
	setting.RobotsTxt = req.RobotsTxt
	setting.OgImageDefaultURL = req.OgImageDefaultURL
	setting.GoogleAnalyticsID = req.GoogleAnalyticsID
	setting.AvailableStatus = req.AvailableStatus
	setting.AvailableBadgeText = req.AvailableBadgeText
	setting.CustomBadgeText = req.CustomBadgeText
	if req.ContactEmail != "" {
		setting.ContactEmail = req.ContactEmail
	}
	if req.ContactLocation != "" {
		setting.ContactLocation = req.ContactLocation
	}
	setting.TurnstileEnabled = req.TurnstileEnabled
	setting.TurnstileSiteKey = req.TurnstileSiteKey
	if req.TurnstileSecretKey != "" {
		setting.TurnstileSecretKey = req.TurnstileSecretKey
	}
	setting.MaintenanceMode = req.MaintenanceMode

	if err := config.DB.Save(&setting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to update site settings"))
		return
	}

	_ = services.Revalidate.InsertJob(config.DB, []string{"/", "/projects", "/certificates", "/experiences", "/skills", "/educations", "/tools", "/contact", "/about", "/terms", "/privacy-policy"})
	c.JSON(http.StatusOK, structs.SuccessResponse("Site settings updated successfully", setting))
}
