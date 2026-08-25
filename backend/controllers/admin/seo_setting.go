package admin

import (
	"net/http"
	"strings"

	"portfolio-arl-backend/config"
	"portfolio-arl-backend/models"
	"portfolio-arl-backend/services"
	"portfolio-arl-backend/structs"
	"github.com/gin-gonic/gin"
)

type SeoSettingController struct{}

func NewSeoSettingController() *SeoSettingController {
	return &SeoSettingController{}
}

func (ctrl *SeoSettingController) ListSeoSettings(c *gin.Context) {
	var settings []models.SeoSetting
	if err := config.DB.Order("path ASC").Find(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to fetch SEO settings"))
		return
	}
	c.JSON(http.StatusOK, structs.SuccessResponse("SEO settings retrieved", settings))
}

func (ctrl *SeoSettingController) GetSeoSettingByPath(c *gin.Context) {
	path := c.Query("path")
	if path == "" {
		path = "/"
	}

	var setting models.SeoSetting
	if err := config.DB.Where("path = ?", path).First(&setting).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("SEO setting not found for path"))
		return
	}
	c.JSON(http.StatusOK, structs.SuccessResponse("SEO setting retrieved", setting))
}

func (ctrl *SeoSettingController) UpsertSeoSetting(c *gin.Context) {
	var req structs.UpdateSeoSettingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Invalid SEO data", nil))
		return
	}

	var setting models.SeoSetting
	config.DB.Where("path = ?", req.Path).First(&setting)

	setting.Path = req.Path
	setting.MetaTitle = req.MetaTitle
	setting.MetaDescription = req.MetaDescription
	setting.OgTitle = req.OgTitle
	setting.OgDescription = req.OgDescription
	setting.OgImageURL = req.OgImageURL
	setting.Canonical = req.Canonical
	setting.JsonLD = req.JsonLD

	if err := config.DB.Save(&setting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to save SEO setting"))
		return
	}

	// Two-way synchronization: If this path matches a page (e.g. /about, /privacy-policy, /terms), keep the page model in sync!
	slug := strings.TrimPrefix(req.Path, "/")
	if slug != "" {
		var page models.Page
		if err := config.DB.Where("slug = ?", slug).First(&page).Error; err == nil {
			page.MetaTitle = req.MetaTitle
			page.MetaDescription = req.MetaDescription
			if req.OgImageURL != "" {
				page.OgImageURL = req.OgImageURL
			}
			_ = config.DB.Save(&page).Error
		}
	}

	_ = services.Revalidate.InsertJob(config.DB, []string{req.Path})
	c.JSON(http.StatusOK, structs.SuccessResponse("SEO setting saved successfully", setting))
}
