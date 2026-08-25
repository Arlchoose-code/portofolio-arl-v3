package public

import (
	"net/http"

	"portfolio-arl-backend/config"
	"portfolio-arl-backend/models"
	"portfolio-arl-backend/services"
	"portfolio-arl-backend/structs"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ProjectController struct{}

func NewProjectController() *ProjectController {
	return &ProjectController{}
}

func (ctrl *ProjectController) ListProjects(c *gin.Context) {
	params := services.Pagination.GetPaginationParams(c)
	query := config.DB.Model(&models.Project{}).
		Where("status = ?", "published").
		Preload("Category").
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		})

	if categorySlug := c.Query("category"); categorySlug != "" {
		var category models.ProjectCategory
		if err := config.DB.Where("slug = ?", categorySlug).First(&category).Error; err == nil {
			query = query.Where("category_id = ?", category.ID)
		}
	}

	if featured := c.Query("featured"); featured == "true" {
		query = query.Where("is_featured = ?", true)
	}

	if params.Search != "" {
		query = query.Where("title LIKE ? OR short_description LIKE ? OR tech_stack LIKE ?", "%"+params.Search+"%", "%"+params.Search+"%", "%"+params.Search+"%")
	}

	var total int64
	query.Count(&total)

	var projects []models.Project
	query.Scopes(services.Pagination.Paginate(params)).
		Order("sort_order ASC, id DESC").
		Find(&projects)

	meta := services.Pagination.BuildMeta(params, total)
	c.JSON(http.StatusOK, structs.SuccessWithMeta("Projects retrieved", projects, meta))
}

func (ctrl *ProjectController) GetProjectBySlug(c *gin.Context) {
	slug := c.Param("slug")
	var project models.Project
	if err := config.DB.Where("slug = ? AND status = ?", slug, "published").
		Preload("Category").
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		First(&project).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Project not found"))
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse("Project retrieved", project))
}
