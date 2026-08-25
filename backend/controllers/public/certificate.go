package public

import (
	"net/http"

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

	if issuer := c.Query("issuer"); issuer != "" {
		query = query.Where("issuer = ?", issuer)
	}

	if params.Search != "" {
		query = query.Where("name LIKE ? OR issuer LIKE ?", "%"+params.Search+"%", "%"+params.Search+"%")
	}

	var total int64
	query.Count(&total)

	var certs []models.Certificate
	query.Scopes(services.Pagination.Paginate(params)).
		Order("sort_order ASC, id DESC").
		Find(&certs)

	meta := services.Pagination.BuildMeta(params, total)
	c.JSON(http.StatusOK, structs.SuccessWithMeta("Certificates retrieved", certs, meta))
}
