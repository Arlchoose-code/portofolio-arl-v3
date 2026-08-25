package services

import (
	"bytes"
	"errors"
	"io"
	"mime/multipart"
	"net/http"
	"strings"
)

type SecurityService struct{}

var Security = &SecurityService{}

var allowedMimeTypes = map[string]bool{
	"image/jpeg": true,
	"image/jpg":  true,
	"image/png":  true,
	"image/webp": true,
}

func (s *SecurityService) ValidateFileSize(size int64, maxMB int64) bool {
	if maxMB <= 0 {
		maxMB = 50
	}
	return size <= maxMB*1024*1024
}

func (s *SecurityService) ValidateMimeType(mime string) bool {
	return allowedMimeTypes[strings.ToLower(strings.TrimSpace(mime))]
}

func (s *SecurityService) CheckMagicBytes(file multipart.File) (string, error) {
	buffer := make([]byte, 512)
	n, err := file.Read(buffer)
	if err != nil && err != io.EOF {
		return "", err
	}
	// Reset file seeker
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return "", err
	}

	contentType := http.DetectContentType(buffer[:n])
	if !s.ValidateMimeType(contentType) {
		// Custom check for webp if DetectContentType returns application/octet-stream
		if n >= 12 && string(buffer[0:4]) == "RIFF" && string(buffer[8:12]) == "WEBP" {
			return "image/webp", nil
		}
		// JPEG check
		if n >= 3 && bytes.Equal(buffer[:3], []byte{0xFF, 0xD8, 0xFF}) {
			return "image/jpeg", nil
		}
		// PNG check
		if n >= 8 && bytes.Equal(buffer[:8], []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}) {
			return "image/png", nil
		}
		return "", errors.New("invalid or unsupported file type")
	}

	return contentType, nil
}
