package services

import (
	"encoding/json"
	"fmt"

	"portfolio-arl-backend/models"
	"gorm.io/gorm"
)

type SeoService struct{}

var Seo = &SeoService{}

func (s *SeoService) AutoGenerateSeo(title, description, imageURL, path string, db *gorm.DB) error {
	var existing models.SeoSetting
	err := db.Where("path = ?", path).First(&existing).Error
	if err == nil {
		return nil // Already exists, do not overwrite custom SEO
	}

	seo := models.SeoSetting{
		Path:            path,
		MetaTitle:       fmt.Sprintf("%s | Syahril Haryono", title),
		MetaDescription: description,
		OgTitle:         title,
		OgDescription:   description,
		OgImageURL:      imageURL,
		Canonical:       path,
	}

	return db.Create(&seo).Error
}

func (s *SeoService) BuildPersonJSONLD(name, url, jobTitle, description string, sameAs []string) string {
	schema := map[string]any{
		"@context": "https://schema.org",
		"@type":    "Person",
		"name":     name,
		"url":      url,
		"jobTitle": jobTitle,
		"description": description,
		"sameAs":   sameAs,
	}

	bytes, _ := json.MarshalIndent(schema, "", "  ")
	return string(bytes)
}

func (s *SeoService) BuildBreadcrumbJSONLD(items []map[string]string) string {
	var listElements []map[string]any
	for i, item := range items {
		listElements = append(listElements, map[string]any{
			"@type":    "ListItem",
			"position": i + 1,
			"name":     item["name"],
			"item":     item["url"],
		})
	}

	schema := map[string]any{
		"@context":        "https://schema.org",
		"@type":           "BreadcrumbList",
		"itemListElement": listElements,
	}

	bytes, _ := json.MarshalIndent(schema, "", "  ")
	return string(bytes)
}
