package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"portfolio-arl-backend/config"
	"portfolio-arl-backend/models"
	"portfolio-arl-backend/structs"
	"gorm.io/gorm"
)

type RevalidateService struct {
	client *http.Client
}

var Revalidate = &RevalidateService{
	client: &http.Client{
		Timeout: 5 * time.Second,
	},
}

// TriggerDirectSync sends an instant HTTP POST to Next.js revalidation endpoint
func (s *RevalidateService) TriggerDirectSync(paths []string) {
	if len(paths) == 0 {
		return
	}

	cfg := config.AppConfigInstance
	if cfg == nil {
		return
	}

	go func(targetPaths []string) {
		payload := structs.RevalidateRequest{Paths: targetPaths}
		jsonBody, err := json.Marshal(payload)
		if err != nil {
			return
		}

		revalidateEndpoint := fmt.Sprintf("%s/api/revalidate", cfg.Revalidation.NextjsURL)
		req, err := http.NewRequest(http.MethodPost, revalidateEndpoint, bytes.NewBuffer(jsonBody))
		if err != nil {
			return
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Revalidate-Secret", cfg.Revalidation.Secret)

		resp, err := s.client.Do(req)
		if err != nil {
			log.Printf("[InstantRevalidate] HTTP request failed: %v\n", err)
			return
		}
		defer resp.Body.Close()

		log.Printf("[InstantRevalidate] Successfully purged Next.js cache for paths: %v (status: %d)\n", targetPaths, resp.StatusCode)
	}(paths)
}

func (s *RevalidateService) InsertJob(db *gorm.DB, paths []string) error {
	if len(paths) == 0 {
		return nil
	}

	// 1. Trigger instant asynchronous HTTP purge to Next.js
	s.TriggerDirectSync(paths)

	// 2. Persist job in DB for reliability / worker backup
	pathsJSON, err := json.Marshal(paths)
	if err != nil {
		return err
	}

	job := models.RevalidationJob{
		Paths:       string(pathsJSON),
		Status:      "pending",
		Attempts:    0,
		MaxAttempts: 3,
	}

	if err := db.Create(&job).Error; err != nil {
		log.Printf("Failed to create revalidation job: %v\n", err)
		return err
	}

	return nil
}
