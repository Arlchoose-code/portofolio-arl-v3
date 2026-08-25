package public

import (
	"net/http"

	"portfolio-arl-backend/config"
	"portfolio-arl-backend/models"
	"portfolio-arl-backend/structs"
	"github.com/gin-gonic/gin"
)

type ExperienceController struct{}

func NewExperienceController() *ExperienceController {
	return &ExperienceController{}
}

func (ctrl *ExperienceController) ListExperiences(c *gin.Context) {
	var exps []models.Experience
	if err := config.DB.Order("sort_order ASC, id DESC").Find(&exps).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to fetch experiences"))
		return
	}
	c.JSON(http.StatusOK, structs.SuccessResponse("Experiences retrieved", exps))
}
