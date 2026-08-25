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

type SkillController struct{}

func NewSkillController() *SkillController {
	return &SkillController{}
}

// Categories
func (ctrl *SkillController) ListCategories(c *gin.Context) {
	var categories []models.SkillCategory
	if err := config.DB.Preload("Skills").Order("sort_order ASC, id ASC").Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to fetch skill categories"))
		return
	}
	c.JSON(http.StatusOK, structs.SuccessResponse("Skill categories retrieved", categories))
}

func (ctrl *SkillController) CreateCategory(c *gin.Context) {
	var req structs.CreateSkillCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Invalid category data", nil))
		return
	}

	cat := models.SkillCategory{
		Name:      req.Name,
		SortOrder: req.SortOrder,
	}

	if err := config.DB.Create(&cat).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to create skill category"))
		return
	}

	_ = services.Revalidate.InsertJob(config.DB, []string{"/skills", "/"})
	c.JSON(http.StatusCreated, structs.SuccessResponse("Skill category created successfully", cat))
}

func (ctrl *SkillController) UpdateCategory(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var cat models.SkillCategory
	if err := config.DB.First(&cat, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Skill category not found"))
		return
	}

	var req structs.UpdateSkillCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Invalid category data", nil))
		return
	}

	cat.Name = req.Name
	cat.SortOrder = req.SortOrder

	if err := config.DB.Save(&cat).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to update skill category"))
		return
	}

	_ = services.Revalidate.InsertJob(config.DB, []string{"/skills", "/"})
	c.JSON(http.StatusOK, structs.SuccessResponse("Skill category updated successfully", cat))
}

func (ctrl *SkillController) DeleteCategory(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := config.DB.Delete(&models.SkillCategory{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to delete category"))
		return
	}
	_ = services.Revalidate.InsertJob(config.DB, []string{"/skills", "/"})
	c.JSON(http.StatusOK, structs.SuccessResponse("Skill category deleted successfully", nil))
}

// Skills
func (ctrl *SkillController) ListSkills(c *gin.Context) {
	params := services.Pagination.GetPaginationParams(c)
	query := config.DB.Model(&models.Skill{}).Preload("Category")

	if catID := c.Query("category_id"); catID != "" {
		query = query.Where("category_id = ?", catID)
	}

	if params.Search != "" {
		query = query.Where("name LIKE ?", "%"+params.Search+"%")
	}

	var total int64
	query.Count(&total)

	var skills []models.Skill
	query.Scopes(services.Pagination.Paginate(params)).
		Order("sort_order ASC, id DESC").
		Find(&skills)

	meta := services.Pagination.BuildMeta(params, total)
	c.JSON(http.StatusOK, structs.SuccessWithMeta("Skills retrieved", skills, meta))
}

func (ctrl *SkillController) GetSkill(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var skill models.Skill
	if err := config.DB.Preload("Category").First(&skill, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Skill not found"))
		return
	}
	c.JSON(http.StatusOK, structs.SuccessResponse("Skill retrieved", skill))
}

func (ctrl *SkillController) CreateSkill(c *gin.Context) {
	var req structs.CreateSkillRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Invalid skill data", nil))
		return
	}

	level := req.Level
	if level == "" {
		level = "intermediate"
	}

	skill := models.Skill{
		Name:       req.Name,
		CategoryID: req.CategoryID,
		IconURL:    req.IconURL,
		Level:      level,
		SortOrder:  req.SortOrder,
	}

	if err := config.DB.Create(&skill).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to create skill"))
		return
	}

	_ = services.Revalidate.InsertJob(config.DB, []string{"/skills", "/"})
	c.JSON(http.StatusCreated, structs.SuccessResponse("Skill created successfully", skill))
}

func (ctrl *SkillController) UpdateSkill(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var skill models.Skill
	if err := config.DB.First(&skill, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Skill not found"))
		return
	}

	var req structs.UpdateSkillRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Invalid skill data", nil))
		return
	}

	level := req.Level
	if level == "" {
		level = "intermediate"
	}

	skill.Name = req.Name
	skill.CategoryID = req.CategoryID
	skill.IconURL = req.IconURL
	skill.Level = level
	skill.SortOrder = req.SortOrder

	if err := config.DB.Save(&skill).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to update skill"))
		return
	}

	_ = services.Revalidate.InsertJob(config.DB, []string{"/skills", "/"})
	c.JSON(http.StatusOK, structs.SuccessResponse("Skill updated successfully", skill))
}

func (ctrl *SkillController) DeleteSkill(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := config.DB.Delete(&models.Skill{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to delete skill"))
		return
	}
	_ = services.Revalidate.InsertJob(config.DB, []string{"/skills", "/"})
	c.JSON(http.StatusOK, structs.SuccessResponse("Skill deleted successfully", nil))
}
