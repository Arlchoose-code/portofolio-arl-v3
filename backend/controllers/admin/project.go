package admin

import (
	"encoding/json"
	"net/http"
	"strconv"

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

func (ctrl *ProjectController) ListCategories(c *gin.Context) {
	var categories []models.ProjectCategory
	if err := config.DB.Order("sort_order ASC, id DESC").Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to fetch project categories"))
		return
	}
	c.JSON(http.StatusOK, structs.SuccessResponse("Project categories retrieved", categories))
}

func (ctrl *ProjectController) CreateCategory(c *gin.Context) {
	var req structs.CreateProjectCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Invalid category data", nil))
		return
	}

	slug := req.Slug
	if slug == "" {
		slug = services.Slug.GenerateSlug(req.Name)
	}
	slug = services.Slug.EnsureUniqueSlug(slug, "project_categories", config.DB, 0)

	cat := models.ProjectCategory{
		Name:      req.Name,
		Slug:      slug,
		SortOrder: req.SortOrder,
	}

	if err := config.DB.Create(&cat).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to create category"))
		return
	}

	_ = services.Revalidate.InsertJob(config.DB, []string{"/projects", "/"})
	c.JSON(http.StatusCreated, structs.SuccessResponse("Category created successfully", cat))
}

func (ctrl *ProjectController) UpdateCategory(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var cat models.ProjectCategory
	if err := config.DB.First(&cat, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Category not found"))
		return
	}

	var req structs.UpdateProjectCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Invalid category data", nil))
		return
	}

	slug := req.Slug
	if slug == "" {
		slug = services.Slug.GenerateSlug(req.Name)
	}
	slug = services.Slug.EnsureUniqueSlug(slug, "project_categories", config.DB, cat.ID)

	cat.Name = req.Name
	cat.Slug = slug
	cat.SortOrder = req.SortOrder

	if err := config.DB.Save(&cat).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to update category"))
		return
	}

	_ = services.Revalidate.InsertJob(config.DB, []string{"/projects", "/"})
	c.JSON(http.StatusOK, structs.SuccessResponse("Category updated successfully", cat))
}

func (ctrl *ProjectController) DeleteCategory(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := config.DB.Delete(&models.ProjectCategory{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to delete category"))
		return
	}
	_ = services.Revalidate.InsertJob(config.DB, []string{"/projects", "/"})
	c.JSON(http.StatusOK, structs.SuccessResponse("Category deleted successfully", nil))
}

func (ctrl *ProjectController) ListProjects(c *gin.Context) {
	params := services.Pagination.GetPaginationParams(c)
	query := config.DB.Model(&models.Project{}).Preload("Category").Preload("Images")

	if params.Search != "" {
		query = query.Where("title LIKE ? OR short_description LIKE ?", "%"+params.Search+"%", "%"+params.Search+"%")
	}

	var total int64
	query.Count(&total)

	var projects []models.Project
	query.Scopes(services.Pagination.Paginate(params)).
		Order(params.Sort + " " + params.Order).
		Find(&projects)

	meta := services.Pagination.BuildMeta(params, total)
	c.JSON(http.StatusOK, structs.SuccessWithMeta("Projects retrieved", projects, meta))
}

func (ctrl *ProjectController) GetProject(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var project models.Project
	if err := config.DB.Preload("Category").Preload("Images", func(db *gorm.DB) *gorm.DB {
		return db.Order("sort_order ASC")
	}).First(&project, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Project not found"))
		return
	}
	c.JSON(http.StatusOK, structs.SuccessResponse("Project retrieved", project))
}

func (ctrl *ProjectController) CreateProject(c *gin.Context) {
	var req structs.CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Invalid project payload", nil))
		return
	}

	slug := req.Slug
	if slug == "" {
		slug = services.Slug.GenerateSlug(req.Title)
	}
	slug = services.Slug.EnsureUniqueSlug(slug, "projects", config.DB, 0)

	techStackJSON, _ := json.Marshal(req.TechStack)
	status := req.Status
	if status == "" {
		status = "published"
	}

	project := models.Project{
		Title:            req.Title,
		Slug:             slug,
		ShortDescription: req.ShortDescription,
		Description:      req.Description,
		CategoryID:       req.CategoryID,
		TechStack:        string(techStackJSON),
		RepoURL:          req.RepoURL,
		DemoURL:          req.DemoURL,
		IsFeatured:       req.IsFeatured,
		Status:           status,
		SortOrder:        req.SortOrder,
	}

	if err := config.DB.Create(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to create project"))
		return
	}

	_ = services.Revalidate.InsertJob(config.DB, []string{"/projects", "/projects/" + project.Slug, "/"})
	c.JSON(http.StatusCreated, structs.SuccessResponse("Project created successfully", project))
}

func (ctrl *ProjectController) UpdateProject(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var project models.Project
	if err := config.DB.First(&project, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Project not found"))
		return
	}

	var req structs.UpdateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Invalid project payload", nil))
		return
	}

	oldSlug := project.Slug
	slug := req.Slug
	if slug == "" {
		slug = services.Slug.GenerateSlug(req.Title)
	}
	slug = services.Slug.EnsureUniqueSlug(slug, "projects", config.DB, project.ID)

	techStackJSON, _ := json.Marshal(req.TechStack)
	status := req.Status
	if status == "" {
		status = "published"
	}

	project.Title = req.Title
	project.Slug = slug
	project.ShortDescription = req.ShortDescription
	project.Description = req.Description
	project.CategoryID = req.CategoryID
	project.TechStack = string(techStackJSON)
	project.RepoURL = req.RepoURL
	project.DemoURL = req.DemoURL
	project.IsFeatured = req.IsFeatured
	project.Status = status
	project.SortOrder = req.SortOrder

	if err := config.DB.Save(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to update project"))
		return
	}

	_ = services.Revalidate.InsertJob(config.DB, []string{"/projects", "/projects/" + oldSlug, "/projects/" + project.Slug, "/"})
	c.JSON(http.StatusOK, structs.SuccessResponse("Project updated successfully", project))
}

func (ctrl *ProjectController) DeleteProject(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var project models.Project
	if err := config.DB.First(&project, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Project not found"))
		return
	}

	if err := config.DB.Delete(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to delete project"))
		return
	}

	_ = services.Revalidate.InsertJob(config.DB, []string{"/projects", "/projects/" + project.Slug, "/"})
	c.JSON(http.StatusOK, structs.SuccessResponse("Project deleted successfully", nil))
}

func (ctrl *ProjectController) AddProjectImage(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var req structs.ProjectImageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Invalid image data", nil))
		return
	}

	img := models.ProjectImage{
		ProjectID:    uint(id),
		ThumbnailURL: req.ThumbnailURL,
		MediumURL:    req.MediumURL,
		OriginalURL:  req.OriginalURL,
		Caption:      req.Caption,
		SortOrder:    req.SortOrder,
	}

	if err := config.DB.Create(&img).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to add project image"))
		return
	}

	c.JSON(http.StatusCreated, structs.SuccessResponse("Project image added successfully", img))
}

func (ctrl *ProjectController) DeleteProjectImage(c *gin.Context) {
	imageId, _ := strconv.Atoi(c.Param("imageId"))
	if err := config.DB.Delete(&models.ProjectImage{}, imageId).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to delete image"))
		return
	}
	c.JSON(http.StatusOK, structs.SuccessResponse("Project image deleted successfully", nil))
}


