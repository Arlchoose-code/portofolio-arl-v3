package services

import (
	"fmt"
	"regexp"
	"strings"

	"gorm.io/gorm"
)

type SlugService struct{}

var Slug = &SlugService{}

var (
	nonAlphanumericRegex = regexp.MustCompile(`[^a-z0-9]+`)
	multipleHyphenRegex  = regexp.MustCompile(`-+`)
)

func (s *SlugService) GenerateSlug(title string) string {
	slug := strings.ToLower(strings.TrimSpace(title))
	slug = nonAlphanumericRegex.ReplaceAllString(slug, "-")
	slug = multipleHyphenRegex.ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")
	if slug == "" {
		slug = "item"
	}
	return slug
}

func (s *SlugService) EnsureUniqueSlug(slug string, tableName string, db *gorm.DB, currentID uint) string {
	originalSlug := slug
	counter := 1

	for {
		var count int64
		query := db.Table(tableName).Where("slug = ?", slug)
		if currentID > 0 {
			query = query.Where("id <> ?", currentID)
		}
		query.Count(&count)

		if count == 0 {
			break
		}

		counter++
		slug = fmt.Sprintf("%s-%d", originalSlug, counter)
	}

	return slug
}
