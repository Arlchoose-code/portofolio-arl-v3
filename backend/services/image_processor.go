package services

import (
	"image"
	"io"
	"os"
	"path/filepath"

	"github.com/deepteams/webp"
	"github.com/disintegration/imaging"
)

type ImageProcessor struct{}

var Processor = &ImageProcessor{}

func (p *ImageProcessor) Decode(filePath string) (image.Image, error) {
	return imaging.Open(filePath)
}

func (p *ImageProcessor) DecodeFromReader(r io.Reader) (image.Image, error) {
	return imaging.Decode(r, imaging.AutoOrientation(true))
}

func (p *ImageProcessor) ResizeToWidth(img image.Image, maxWidth int) image.Image {
	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	if width <= maxWidth {
		return img
	}

	ratio := float64(maxWidth) / float64(width)
	newHeight := int(float64(height) * ratio)

	return imaging.Resize(img, maxWidth, newHeight, imaging.Lanczos)
}

func (p *ImageProcessor) SaveWebP(img image.Image, destPath string, quality float32) error {
	dir := filepath.Dir(destPath)
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		return err
	}

	outFile, err := os.Create(destPath)
	if err != nil {
		return err
	}
	defer outFile.Close()

	opt := &webp.Options{
		Lossless: false,
		Quality:  quality,
	}

	return webp.Encode(outFile, img, opt)
}

func (p *ImageProcessor) SaveImage(img image.Image, destPath string) error {
	dir := filepath.Dir(destPath)
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		return err
	}
	return imaging.Save(img, destPath)
}
