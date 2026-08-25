package public

import (
	"net/http"

	"portfolio-arl-backend/config"
	"portfolio-arl-backend/models"
	"portfolio-arl-backend/structs"
	"github.com/gin-gonic/gin"
)

type EducationController struct{}

func NewEducationController() *EducationController {
	return &EducationController{}
}

func (ctrl *EducationController) ListEducations(c *gin.Context) {
	var edus []models.Education
	query := config.DB.Order("sort_order ASC, id DESC")

	if filterType := c.Query("type"); filterType != "" {
		query = query.Where("type = ?", filterType)
	}

	if err := query.Find(&edus).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to fetch education records"))
		return
	}
	c.JSON(http.StatusOK, structs.SuccessResponse("Education records retrieved", edus))
}
