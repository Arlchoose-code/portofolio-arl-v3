package public

import (
	"net/http"

	"portfolio-arl-backend/config"
	"portfolio-arl-backend/models"
	"portfolio-arl-backend/structs"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SkillController struct{}

func NewSkillController() *SkillController {
	return &SkillController{}
}

func (ctrl *SkillController) ListSkills(c *gin.Context) {
	var categories []models.SkillCategory
	if err := config.DB.Preload("Skills", func(db *gorm.DB) *gorm.DB {
		return db.Order("sort_order ASC, id ASC")
	}).Order("sort_order ASC, id ASC").Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to fetch skills"))
		return
	}
	c.JSON(http.StatusOK, structs.SuccessResponse("Skills retrieved", categories))
}
