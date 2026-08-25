package public

import (
	"net/http"

	"portfolio-arl-backend/config"
	"portfolio-arl-backend/models"
	"portfolio-arl-backend/structs"
	"github.com/gin-gonic/gin"
)

type PageController struct{}

func NewPageController() *PageController {
	return &PageController{}
}

func (ctrl *PageController) GetPageBySlug(c *gin.Context) {
	slug := c.Param("slug")
	var page models.Page
	if err := config.DB.Where("slug = ? AND status = ?", slug, "published").First(&page).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Page not found"))
		return
	}
	c.JSON(http.StatusOK, structs.SuccessResponse("Page retrieved", page))
}
