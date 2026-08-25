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

type MediaController struct {
	cfg *config.Config
}

func NewMediaController(cfg *config.Config) *MediaController {
	return &MediaController{cfg: cfg}
}

func (ctrl *MediaController) ListMedia(c *gin.Context) {
	params := services.Pagination.GetPaginationParams(c)
	if params.PerPage == 10 && c.Query("per_page") == "" {
		params.PerPage = 20 // Default per_page 20 for media grid
	}

	query := config.DB.Model(&models.Media{})
	if params.Search != "" {
		query = query.Where("original_name LIKE ? OR filename LIKE ?", "%"+params.Search+"%", "%"+params.Search+"%")
	}

	var total int64
	query.Count(&total)

	var mediaItems []models.Media
	query.Scopes(services.Pagination.Paginate(params)).
		Order("id DESC").
		Find(&mediaItems)

	meta := services.Pagination.BuildMeta(params, total)
	c.JSON(http.StatusOK, structs.SuccessWithMeta("Media retrieved", mediaItems, meta))
}

func (ctrl *MediaController) UploadMedia(c *gin.Context) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse("File is required"))
		return
	}

	media, err := services.Image.UploadImage(fileHeader, ctrl.cfg)
	if err != nil {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse(err.Error()))
		return
	}

	if err := config.DB.Create(media).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to save media metadata"))
		return
	}

	c.JSON(http.StatusCreated, structs.SuccessResponse("Media uploaded successfully", media))
}

func (ctrl *MediaController) DeleteMedia(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var media models.Media
	if err := config.DB.First(&media, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Media not found"))
		return
	}

	_ = services.Image.DeleteMediaFiles(&media, ctrl.cfg)

	if err := config.DB.Delete(&media).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to delete media record"))
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse("Media deleted successfully", nil))
}
