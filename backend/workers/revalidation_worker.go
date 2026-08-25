package workers

import (
	"bytes"
	"context"
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

type RevalidationWorker struct {
	cfg    *config.Config
	db     *gorm.DB
	client *http.Client
}

func NewRevalidationWorker(cfg *config.Config, db *gorm.DB) *RevalidationWorker {
	return &RevalidationWorker{
		cfg: cfg,
		db:  db,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (w *RevalidationWorker) Start(ctx context.Context) {
	ticker := time.NewTicker(w.cfg.Revalidation.WorkerPollInterval)
	defer ticker.Stop()

	log.Printf("Revalidation worker started with poll interval %v\n", w.cfg.Revalidation.WorkerPollInterval)

	for {
		select {
		case <-ctx.Done():
			log.Println("Revalidation worker stopped.")
			return
		case <-ticker.C:
			w.ProcessNextJob()
		}
	}
}

func (w *RevalidationWorker) ProcessNextJob() {
	var job models.RevalidationJob
	err := w.db.Session(&gorm.Session{Logger: w.db.Logger.LogMode(1)}).
		Where("status IN ? AND attempts < max_attempts", []string{"pending", "failed"}).
		Order("created_at ASC").
		First(&job).Error

	if err != nil {
		return // No pending jobs
	}

	job.Status = "processing"
	job.Attempts++
	w.db.Save(&job)

	var paths []string
	if err := json.Unmarshal([]byte(job.Paths), &paths); err != nil {
		job.Status = "failed"
		job.ErrorMessage = fmt.Sprintf("Failed to parse paths JSON: %v", err)
		w.db.Save(&job)
		return
	}

	payload := structs.RevalidateRequest{Paths: paths}
	jsonBody, err := json.Marshal(payload)
	if err != nil {
		job.Status = "failed"
		job.ErrorMessage = fmt.Sprintf("Failed to encode payload: %v", err)
		w.db.Save(&job)
		return
	}

	revalidateEndpoint := fmt.Sprintf("%s/api/revalidate", w.cfg.Revalidation.NextjsURL)
	req, err := http.NewRequest(http.MethodPost, revalidateEndpoint, bytes.NewBuffer(jsonBody))
	if err != nil {
		job.Status = "failed"
		job.ErrorMessage = fmt.Sprintf("Failed to construct HTTP request: %v", err)
		w.db.Save(&job)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Revalidate-Secret", w.cfg.Revalidation.Secret)

	resp, err := w.client.Do(req)
	if err != nil {
		job.Status = "failed"
		job.ErrorMessage = fmt.Sprintf("HTTP request failed: %v", err)
		w.db.Save(&job)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		job.Status = "done"
		job.ErrorMessage = ""
		w.db.Save(&job)
		log.Printf("Successfully revalidated paths: %v\n", paths)
	} else {
		job.Status = "failed"
		job.ErrorMessage = fmt.Sprintf("HTTP returned status code %d", resp.StatusCode)
		w.db.Save(&job)
		log.Printf("Failed revalidation for paths %v with status %d\n", paths, resp.StatusCode)
	}
}
