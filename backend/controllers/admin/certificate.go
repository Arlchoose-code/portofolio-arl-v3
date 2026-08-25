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

type CertificateController struct{}

func NewCertificateController() *CertificateController {
	return &CertificateController{}
}

func (ctrl *CertificateController) ListCertificates(c *gin.Context) {
	params := services.Pagination.GetPaginationParams(c)
	query := config.DB.Model(&models.Certificate{})

	if params.Search != "" {
		query = query.Where("name LIKE ? OR issuer LIKE ?", "%"+params.Search+"%", "%"+params.Search+"%")
	}

	var total int64
	query.Count(&total)

	var certs []models.Certificate
	query.Scopes(services.Pagination.Paginate(params)).
		Order(params.Sort + " " + params.Order).
		Find(&certs)

	meta := services.Pagination.BuildMeta(params, total)
	c.JSON(http.StatusOK, structs.SuccessWithMeta("Certificates retrieved", certs, meta))
}

func (ctrl *CertificateController) GetCertificate(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var cert models.Certificate
	if err := config.DB.First(&cert, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Certificate not found"))
		return
	}
	c.JSON(http.StatusOK, structs.SuccessResponse("Certificate retrieved", cert))
}

func (ctrl *CertificateController) CreateCertificate(c *gin.Context) {
	var req structs.CreateCertificateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Invalid certificate data", nil))
		return
	}

	cert := models.Certificate{
		Name:          req.Name,
		Issuer:        req.Issuer,
		IssueDate:     req.IssueDate,
		CredentialID:  req.CredentialID,
		CredentialURL: req.CredentialURL,
		ThumbnailURL:  req.ThumbnailURL,
		MediumURL:     req.MediumURL,
		OriginalURL:   req.OriginalURL,
		Description:   req.Description,
		SortOrder:     req.SortOrder,
	}

	if err := config.DB.Create(&cert).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to create certificate"))
		return
	}

	_ = services.Revalidate.InsertJob(config.DB, []string{"/certificates", "/"})
	c.JSON(http.StatusCreated, structs.SuccessResponse("Certificate created successfully", cert))
}

func (ctrl *CertificateController) UpdateCertificate(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var cert models.Certificate
	if err := config.DB.First(&cert, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Certificate not found"))
		return
	}

	var req structs.UpdateCertificateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Invalid certificate data", nil))
		return
	}

	cert.Name = req.Name
	cert.Issuer = req.Issuer
	cert.IssueDate = req.IssueDate
	cert.CredentialID = req.CredentialID
	cert.CredentialURL = req.CredentialURL
	cert.ThumbnailURL = req.ThumbnailURL
	cert.MediumURL = req.MediumURL
	cert.OriginalURL = req.OriginalURL
	cert.Description = req.Description
	cert.SortOrder = req.SortOrder

	if err := config.DB.Save(&cert).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to update certificate"))
		return
	}

	_ = services.Revalidate.InsertJob(config.DB, []string{"/certificates", "/"})
	c.JSON(http.StatusOK, structs.SuccessResponse("Certificate updated successfully", cert))
}

func (ctrl *CertificateController) DeleteCertificate(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := config.DB.Delete(&models.Certificate{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Failed to delete certificate"))
		return
	}
	_ = services.Revalidate.InsertJob(config.DB, []string{"/certificates", "/"})
	c.JSON(http.StatusOK, structs.SuccessResponse("Certificate deleted successfully", nil))
}
