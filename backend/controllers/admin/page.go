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

type PageController struct{}

func NewPageController() *PageController {
	return &PageController{}
}

func (ctrl *PageController) ListPages(c *gin.Context) {
	params := services.Pagination.GetPaginationParams(c)
	query := config.DB.Model(&models.Page{})

	if params.Search != "" {
		query = query.Where("title LIKE ? OR content LIKE ?", "%"+params.Search+"%", "%"+params.Search+"%")
	}

	var total int64
	query.Count(&total)

	var pages []models.Page
	query.Scopes(services.Pagination.Paginate(params)).
		Order("sort_order ASC, id DESC").
		Find(&pages)

	meta := services.Pagination.BuildMeta(params, total)
	c.JSON(http.StatusOK, structs.SuccessWithMeta("Pages retrieved", pages, meta))
}

func (ctrl *PageController) GetPage(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var page models.Page
	if err := config.DB.First(&page, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Page not found"))
		return
	}
	c.JSON(http.StatusOK, structs.SuccessResponse("Page retrieved", page))
}

func (ctrl *PageController) CreatePage(c *gin.Context) {
	var req structs.CreatePageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Invalid page data", nil))
		return
	}

	slug := req.Slug
	if slug == "" {
		slug = services.Slug.GenerateSlug(req.Title)
	}
	slug = services.Slug.EnsureUniqueSlug(slug, "pages", config.DB, 0)

	status := req.Status
	if status == "" {
		status = "published"
	}

	page := models.Page{
		Title:           req.Title,
		Slug:            slug,
		Content:         req.Content,
		ImageURL:        req.ImageURL,
		Status:          status,
		MetaTitle:       req.MetaTitle,
		MetaDescription: req.MetaDescription,
		OgImageURL:      req.OgImageURL,
		SortOrder:       req.SortOrder,
	}

	if err := config.DB.Create(&page).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to create page"))
		return
	}

	// Two-way synchronization: update or create corresponding seo_setting
	var seo models.SeoSetting
	config.DB.Where("path = ?", "/"+page.Slug).First(&seo)
	seo.Path = "/" + page.Slug
	seo.MetaTitle = page.MetaTitle
	seo.MetaDescription = page.MetaDescription
	seo.OgTitle = page.MetaTitle
	seo.OgDescription = page.MetaDescription
	if page.OgImageURL != "" {
		seo.OgImageURL = page.OgImageURL
	}
	seo.Canonical = "/" + page.Slug
	_ = config.DB.Save(&seo).Error

	_ = services.Revalidate.InsertJob(config.DB, []string{"/" + page.Slug})
	c.JSON(http.StatusCreated, structs.SuccessResponse("Page created successfully", page))
}

func (ctrl *PageController) UpdatePage(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var page models.Page
	if err := config.DB.First(&page, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Page not found"))
		return
	}

	var req structs.UpdatePageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Invalid page data", nil))
		return
	}

	oldSlug := page.Slug
	slug := req.Slug
	if slug == "" {
		slug = services.Slug.GenerateSlug(req.Title)
	}
	slug = services.Slug.EnsureUniqueSlug(slug, "pages", config.DB, page.ID)

	status := req.Status
	if status == "" {
		status = "published"
	}

	page.Title = req.Title
	page.Slug = slug
	page.Content = req.Content
	page.ImageURL = req.ImageURL
	page.Status = status
	page.MetaTitle = req.MetaTitle
	page.MetaDescription = req.MetaDescription
	page.OgImageURL = req.OgImageURL
	page.SortOrder = req.SortOrder

	if err := config.DB.Save(&page).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to update page"))
		return
	}

	// Two-way synchronization: update or create corresponding seo_setting
	var seo models.SeoSetting
	config.DB.Where("path = ?", "/"+page.Slug).First(&seo)
	seo.Path = "/" + page.Slug
	seo.MetaTitle = page.MetaTitle
	seo.MetaDescription = page.MetaDescription
	seo.OgTitle = page.MetaTitle
	seo.OgDescription = page.MetaDescription
	if page.OgImageURL != "" {
		seo.OgImageURL = page.OgImageURL
	}
	seo.Canonical = "/" + page.Slug
	_ = config.DB.Save(&seo).Error

	_ = services.Revalidate.InsertJob(config.DB, []string{"/" + oldSlug, "/" + page.Slug})
	c.JSON(http.StatusOK, structs.SuccessResponse("Page updated successfully", page))
}

func (ctrl *PageController) DeletePage(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var page models.Page
	if err := config.DB.First(&page, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Page not found"))
		return
	}

	if err := config.DB.Delete(&page).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to delete page"))
		return
	}

	_ = services.Revalidate.InsertJob(config.DB, []string{"/" + page.Slug})
	c.JSON(http.StatusOK, structs.SuccessResponse("Page deleted successfully", nil))
}
