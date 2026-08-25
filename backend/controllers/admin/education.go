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

type EducationController struct{}

func NewEducationController() *EducationController {
	return &EducationController{}
}

func (ctrl *EducationController) ListEducations(c *gin.Context) {
	params := services.Pagination.GetPaginationParams(c)
	query := config.DB.Model(&models.Education{})

	if filterType := c.Query("type"); filterType != "" {
		query = query.Where("type = ?", filterType)
	}

	if params.Search != "" {
		query = query.Where("institution LIKE ? OR major LIKE ? OR degree LIKE ?", "%"+params.Search+"%", "%"+params.Search+"%", "%"+params.Search+"%")
	}

	var total int64
	query.Count(&total)

	var edus []models.Education
	query.Scopes(services.Pagination.Paginate(params)).
		Order("sort_order ASC, id DESC").
		Find(&edus)

	meta := services.Pagination.BuildMeta(params, total)
	c.JSON(http.StatusOK, structs.SuccessWithMeta("Educations retrieved", edus, meta))
}

func (ctrl *EducationController) GetEducation(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var edu models.Education
	if err := config.DB.First(&edu, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Education record not found"))
		return
	}
	c.JSON(http.StatusOK, structs.SuccessResponse("Education record retrieved", edu))
}

func (ctrl *EducationController) CreateEducation(c *gin.Context) {
	var req structs.CreateEducationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Invalid education data", nil))
		return
	}

	eduType := req.Type
	if eduType == "" {
		eduType = "education"
	}

	edu := models.Education{
		Institution:  req.Institution,
		Degree:       req.Degree,
		Major:        req.Major,
		StartYear:    req.StartYear,
		EndYear:      req.EndYear,
		IsCurrent:    req.IsCurrent,
		GPA:          req.GPA,
		Description:  req.Description,
		ThumbnailURL: req.ThumbnailURL,
		MediumURL:    req.MediumURL,
		OriginalURL:  req.OriginalURL,
		Type:         eduType,
		SortOrder:    req.SortOrder,
	}

	if err := config.DB.Create(&edu).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to create education record"))
		return
	}

	_ = services.Revalidate.InsertJob(config.DB, []string{"/educations", "/"})
	c.JSON(http.StatusCreated, structs.SuccessResponse("Education record created successfully", edu))
}

func (ctrl *EducationController) UpdateEducation(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var edu models.Education
	if err := config.DB.First(&edu, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Education record not found"))
		return
	}

	var req structs.UpdateEducationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Invalid education data", nil))
		return
	}

	eduType := req.Type
	if eduType == "" {
		eduType = "education"
	}

	edu.Institution = req.Institution
	edu.Degree = req.Degree
	edu.Major = req.Major
	edu.StartYear = req.StartYear
	edu.EndYear = req.EndYear
	edu.IsCurrent = req.IsCurrent
	edu.GPA = req.GPA
	edu.Description = req.Description
	edu.ThumbnailURL = req.ThumbnailURL
	edu.MediumURL = req.MediumURL
	edu.OriginalURL = req.OriginalURL
	edu.Type = eduType
	edu.SortOrder = req.SortOrder

	if err := config.DB.Save(&edu).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to update education record"))
		return
	}

	_ = services.Revalidate.InsertJob(config.DB, []string{"/educations", "/"})
	c.JSON(http.StatusOK, structs.SuccessResponse("Education record updated successfully", edu))
}

func (ctrl *EducationController) DeleteEducation(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := config.DB.Delete(&models.Education{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to delete education record"))
		return
	}
	_ = services.Revalidate.InsertJob(config.DB, []string{"/educations", "/"})
	c.JSON(http.StatusOK, structs.SuccessResponse("Education record deleted successfully", nil))
}
