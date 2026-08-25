package admin

import (
	"net/http"
	"strconv"

	"portfolio-arl-backend/config"
	"portfolio-arl-backend/models"
	"portfolio-arl-backend/services"
	"portfolio-arl-backend/structs"
	"github.com/gin-gonic/gin"
)

type SocialLinkController struct{}

func NewSocialLinkController() *SocialLinkController {
	return &SocialLinkController{}
}

func (ctrl *SocialLinkController) ListSocialLinks(c *gin.Context) {
	var links []models.SocialLink
	if err := config.DB.Order("sort_order ASC, id ASC").Find(&links).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to fetch social links"))
		return
	}
	c.JSON(http.StatusOK, structs.SuccessResponse("Social links retrieved", links))
}

func (ctrl *SocialLinkController) CreateSocialLink(c *gin.Context) {
	var req structs.CreateSocialLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Invalid social link data", nil))
		return
	}

	link := models.SocialLink{
		Platform:  req.Platform,
		URL:       req.URL,
		Icon:      req.Icon,
		SortOrder: req.SortOrder,
		IsActive:  req.IsActive,
	}

	if err := config.DB.Create(&link).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to create social link"))
		return
	}

	_ = services.Revalidate.InsertJob(config.DB, []string{"/", "/about", "/contact", "/projects", "/certificates", "/experiences", "/skills", "/educations", "/tools"})
	c.JSON(http.StatusCreated, structs.SuccessResponse("Social link created successfully", link))
}

func (ctrl *SocialLinkController) UpdateSocialLink(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var link models.SocialLink
	if err := config.DB.First(&link, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Social link not found"))
		return
	}

	var req structs.UpdateSocialLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Invalid social link data", nil))
		return
	}

	link.Platform = req.Platform
	link.URL = req.URL
	link.Icon = req.Icon
	link.SortOrder = req.SortOrder
	link.IsActive = req.IsActive

	if err := config.DB.Save(&link).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to update social link"))
		return
	}

	_ = services.Revalidate.InsertJob(config.DB, []string{"/", "/about", "/contact", "/projects", "/certificates", "/experiences", "/skills", "/educations", "/tools"})
	c.JSON(http.StatusOK, structs.SuccessResponse("Social link updated successfully", link))
}

func (ctrl *SocialLinkController) DeleteSocialLink(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := config.DB.Delete(&models.SocialLink{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to delete social link"))
		return
	}
	_ = services.Revalidate.InsertJob(config.DB, []string{"/", "/about", "/contact", "/projects", "/certificates", "/experiences", "/skills", "/educations", "/tools"})
	c.JSON(http.StatusOK, structs.SuccessResponse("Social link deleted successfully", nil))
}
