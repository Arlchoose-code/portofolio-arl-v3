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
)

type ExperienceController struct{}

func NewExperienceController() *ExperienceController {
	return &ExperienceController{}
}

func (ctrl *ExperienceController) ListExperiences(c *gin.Context) {
	params := services.Pagination.GetPaginationParams(c)
	query := config.DB.Model(&models.Experience{})

	if params.Search != "" {
		query = query.Where("company LIKE ? OR position LIKE ? OR description LIKE ?", "%"+params.Search+"%", "%"+params.Search+"%", "%"+params.Search+"%")
	}

	var total int64
	query.Count(&total)

	var exps []models.Experience
	query.Scopes(services.Pagination.Paginate(params)).
		Order("sort_order ASC, id DESC").
		Find(&exps)

	meta := services.Pagination.BuildMeta(params, total)
	c.JSON(http.StatusOK, structs.SuccessWithMeta("Experiences retrieved", exps, meta))
}

func (ctrl *ExperienceController) GetExperience(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var exp models.Experience
	if err := config.DB.First(&exp, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Experience not found"))
		return
	}
	c.JSON(http.StatusOK, structs.SuccessResponse("Experience retrieved", exp))
}

func (ctrl *ExperienceController) CreateExperience(c *gin.Context) {
	var req structs.CreateExperienceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Invalid experience data", nil))
		return
	}

	techJSON, _ := json.Marshal(req.TechStack)
	workMode := req.WorkMode
	if workMode == "" {
		workMode = "remote"
	}

	exp := models.Experience{
		Company:     req.Company,
		Position:    req.Position,
		Type:        req.Type,
		Location:    req.Location,
		WorkMode:    workMode,
		StartDate:   req.StartDate,
		EndDate:     req.EndDate,
		IsCurrent:   req.IsCurrent,
		TechStack:   string(techJSON),
		Description: req.Description,
		SortOrder:   req.SortOrder,
	}

	if err := config.DB.Create(&exp).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to create experience"))
		return
	}

	_ = services.Revalidate.InsertJob(config.DB, []string{"/experiences", "/"})
	c.JSON(http.StatusCreated, structs.SuccessResponse("Experience created successfully", exp))
}

func (ctrl *ExperienceController) UpdateExperience(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var exp models.Experience
	if err := config.DB.First(&exp, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Experience not found"))
		return
	}

	var req structs.UpdateExperienceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Invalid experience data", nil))
		return
	}

	techJSON, _ := json.Marshal(req.TechStack)
	workMode := req.WorkMode
	if workMode == "" {
		workMode = "remote"
	}

	exp.Company = req.Company
	exp.Position = req.Position
	exp.Type = req.Type
	exp.Location = req.Location
	exp.WorkMode = workMode
	exp.StartDate = req.StartDate
	exp.EndDate = req.EndDate
	exp.IsCurrent = req.IsCurrent
	exp.TechStack = string(techJSON)
	exp.Description = req.Description
	exp.SortOrder = req.SortOrder

	if err := config.DB.Save(&exp).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to update experience"))
		return
	}

	_ = services.Revalidate.InsertJob(config.DB, []string{"/experiences", "/"})
	c.JSON(http.StatusOK, structs.SuccessResponse("Experience updated successfully", exp))
}

func (ctrl *ExperienceController) DeleteExperience(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := config.DB.Delete(&models.Experience{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to delete experience"))
		return
	}
	_ = services.Revalidate.InsertJob(config.DB, []string{"/experiences", "/"})
	c.JSON(http.StatusOK, structs.SuccessResponse("Experience deleted successfully", nil))
}
