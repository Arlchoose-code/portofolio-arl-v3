package services

import (
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"

	"portfolio-arl-backend/config"
	"portfolio-arl-backend/models"
	"github.com/google/uuid"
)

type ImageService struct{}

var Image = &ImageService{}

func (s *ImageService) UploadImage(fileHeader *multipart.FileHeader, cfg *config.Config) (*models.Media, error) {
	maxSize := cfg.Storage.MaxSizeMB
	if maxSize < 100 {
		maxSize = 100
	}
	if !Security.ValidateFileSize(fileHeader.Size, maxSize) {
		return nil, fmt.Errorf("file size exceeds maximum limit of %d MB", maxSize)
	}

	srcFile, err := fileHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open uploaded file: %w", err)
	}
	defer srcFile.Close()

	_, err = Security.CheckMagicBytes(srcFile)
	if err != nil {
		return nil, fmt.Errorf("invalid file format: %w", err)
	}

	// Seek back to start of file for decoding
	if seeker, ok := srcFile.(io.ReadSeeker); ok {
		_, _ = seeker.Seek(0, io.SeekStart)
	}

	// Decode source image
	img, err := Processor.DecodeFromReader(srcFile)
	if err != nil {
		return nil, fmt.Errorf("failed to decode image: %w", err)
	}

	bounds := img.Bounds()
	origWidth := bounds.Dx()
	origHeight := bounds.Dy()

	// Always convert & save as high-efficiency modern .webp
	newID := uuid.New().String()
	baseFilename := fmt.Sprintf("%s.webp", newID)

	// Ensure destination folders exist
	baseStorage := cfg.Storage.Path
	origDir := filepath.Join(baseStorage, "originals")
	medDir := filepath.Join(baseStorage, "medium")
	thumbDir := filepath.Join(baseStorage, "thumbnails")
	_ = os.MkdirAll(origDir, os.ModePerm)
	_ = os.MkdirAll(medDir, os.ModePerm)
	_ = os.MkdirAll(thumbDir, os.ModePerm)

	// 1. Save Original converted to WebP (Quality: 85 - pristine quality with ~70-85% size reduction)
	origFilePath := filepath.Join(origDir, baseFilename)
	if err := Processor.SaveWebP(img, origFilePath, 85.0); err != nil {
		return nil, fmt.Errorf("failed to encode original to webp: %w", err)
	}

	// 2. Resize & Save Medium as WebP (Quality: 80)
	medWidth := cfg.Storage.MediumWidth
	if medWidth <= 0 {
		medWidth = 800
	}
	medImg := Processor.ResizeToWidth(img, medWidth)
	medFilePath := filepath.Join(medDir, baseFilename)
	if err := Processor.SaveWebP(medImg, medFilePath, 80.0); err != nil {
		return nil, fmt.Errorf("failed to save medium webp image: %w", err)
	}

	// 3. Resize & Save Thumbnail as WebP (Quality: 75)
	thumbWidth := cfg.Storage.ThumbnailWidth
	if thumbWidth <= 0 {
		thumbWidth = 300
	}
	thumbImg := Processor.ResizeToWidth(img, thumbWidth)
	thumbFilePath := filepath.Join(thumbDir, baseFilename)
	if err := Processor.SaveWebP(thumbImg, thumbFilePath, 75.0); err != nil {
		return nil, fmt.Errorf("failed to save thumbnail webp image: %w", err)
	}

	// Get final compressed file size
	finalSize := fileHeader.Size
	if stat, err := os.Stat(origFilePath); err == nil {
		finalSize = stat.Size()
	}

	media := &models.Media{
		Filename:     baseFilename,
		OriginalName: fileHeader.Filename,
		ThumbnailURL: fmt.Sprintf("/storage/media/thumbnails/%s", baseFilename),
		MediumURL:    fmt.Sprintf("/storage/media/medium/%s", baseFilename),
		OriginalURL:  fmt.Sprintf("/storage/media/originals/%s", baseFilename),
		MimeType:     "image/webp",
		SizeBytes:    finalSize,
		Width:        origWidth,
		Height:       origHeight,
	}

	return media, nil
}

func (s *ImageService) DeleteMediaFiles(media *models.Media, cfg *config.Config) error {
	if media == nil || media.Filename == "" {
		return errors.New("invalid media object")
	}

	baseStorage := cfg.Storage.Path
	_ = os.Remove(filepath.Join(baseStorage, "originals", media.Filename))
	_ = os.Remove(filepath.Join(baseStorage, "medium", media.Filename))
	_ = os.Remove(filepath.Join(baseStorage, "thumbnails", media.Filename))
	return nil
}
