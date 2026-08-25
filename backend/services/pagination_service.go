package services

import (
	"math"
	"strconv"
	"strings"

	"portfolio-arl-backend/structs"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type PaginationService struct{}

var Pagination = &PaginationService{}

func (s *PaginationService) GetPaginationParams(c *gin.Context) structs.PaginationParams {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}

	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	if perPage < 1 {
		perPage = 10
	} else if perPage > 100 {
		perPage = 100
	}

	search := strings.TrimSpace(c.Query("search"))
	sort := strings.TrimSpace(c.DefaultQuery("sort", "id"))
	order := strings.ToUpper(strings.TrimSpace(c.DefaultQuery("order", "DESC")))
	if order != "ASC" && order != "DESC" {
		order = "DESC"
	}

	return structs.PaginationParams{
		Page:    page,
		PerPage: perPage,
		Search:  search,
		Sort:    sort,
		Order:   order,
	}
}

func (s *PaginationService) Paginate(params structs.PaginationParams) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		offset := (params.Page - 1) * params.PerPage
		return db.Offset(offset).Limit(params.PerPage)
	}
}

func (s *PaginationService) BuildMeta(params structs.PaginationParams, total int64) structs.Meta {
	totalPages := int(math.Ceil(float64(total) / float64(params.PerPage)))
	if totalPages < 1 {
		totalPages = 1
	}
	return structs.Meta{
		Page:       params.Page,
		PerPage:    params.PerPage,
		Total:      total,
		TotalPages: totalPages,
	}
}
