package public

import (
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"portfolio-arl-backend/config"
	"portfolio-arl-backend/models"
	"github.com/gin-gonic/gin"
)

type YouTubeToolController struct{}

func NewYouTubeToolController() *YouTubeToolController {
	return &YouTubeToolController{}
}

type ymcdnInitResponse struct {
	ConvertURL string `json:"convertURL"`
	Error      int    `json:"error"`
	Country    string `json:"country"`
}

type ymcdnConvertResponse struct {
	Hash        string `json:"hash"`
	Title       string `json:"title"`
	Error       int    `json:"error"`
	ProgressURL string `json:"progressURL"`
	DownloadURL string `json:"downloadURL"`
	RedirectURL string `json:"redirectURL"`
	Redirect    int    `json:"redirect"`
}

type ymcdnProgressResponse struct {
	Sid      int    `json:"sid"`
	Error    int    `json:"error"`
	Progress int    `json:"progress"`
	Percent  int    `json:"percent"`
	Title    string `json:"title"`
}

// Convert processes a video URL and returns internal download & thumbnail links
func (ctrl *YouTubeToolController) Convert(c *gin.Context) {
	rawURL := strings.TrimSpace(c.Query("url"))
	format := strings.ToLower(strings.TrimSpace(c.Query("format")))
	if format != "mp3" && format != "mp4" {
		format = "mp4"
	}

	if rawURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  false,
			"message": "URL video tidak boleh kosong.",
		})
		return
	}

	// 1. Guard check: Is youtube-downloader active?
	db := config.DB
	var toolSetting models.ToolSetting
	if err := db.Where("slug = ?", "youtube-downloader").First(&toolSetting).Error; err == nil {
		if !toolSetting.IsEnabled {
			c.JSON(http.StatusForbidden, gin.H{
				"status":  false,
				"message": "Layanan Pengunduh Video sedang dinonaktifkan oleh administrator.",
			})
			return
		}
	}

	// 2. Extract 11-character video ID
	videoID := extractYouTubeID(rawURL)
	if videoID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  false,
			"message": "Tautan video tidak valid. Masukkan link video/shorts yang valid.",
		})
		return
	}

	client := &http.Client{
		Timeout: 15 * time.Second,
	}

	// 3. Step 1: Init API
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	initURL := fmt.Sprintf("https://a.ymcdn.org/api/v1/init?p=y&23=1llum1n471&_=%f", r.Float64())

	initReq, err := http.NewRequest("GET", initURL, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  false,
			"message": "Gagal menginisialisasi gateway pemroses video.",
		})
		return
	}

	initReq.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	initReq.Header.Set("Origin", "https://id.ytmp3.mobi")
	initReq.Header.Set("Referer", "https://id.ytmp3.mobi/")
	initReq.Header.Set("Accept", "*/*")

	initResp, err := client.Do(initReq)
	if err != nil || initResp.StatusCode != http.StatusOK {
		c.JSON(http.StatusBadGateway, gin.H{
			"status":  false,
			"message": "Gagal terhubung ke gateway pemroses video.",
		})
		return
	}
	defer initResp.Body.Close()

	initBody, _ := io.ReadAll(initResp.Body)
	var initData ymcdnInitResponse
	if err := json.Unmarshal(initBody, &initData); err != nil || initData.ConvertURL == "" {
		c.JSON(http.StatusBadGateway, gin.H{
			"status":  false,
			"message": "Respon gateway server tidak valid.",
		})
		return
	}

	// 4. Step 2: Convert API
	convertURL := fmt.Sprintf("%s&v=%s&f=%s&_=%f", initData.ConvertURL, videoID, format, r.Float64())
	convReq, err := http.NewRequest("GET", convertURL, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  false,
			"message": "Gagal membuat request pemrosesan.",
		})
		return
	}

	convReq.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	convReq.Header.Set("Origin", "https://id.ytmp3.mobi")
	convReq.Header.Set("Referer", "https://id.ytmp3.mobi/")
	convReq.Header.Set("Accept", "*/*")

	convResp, err := client.Do(convReq)
	if err != nil || convResp.StatusCode != http.StatusOK {
		c.JSON(http.StatusBadGateway, gin.H{
			"status":  false,
			"message": "Gagal memproses berkas media.",
		})
		return
	}
	defer convResp.Body.Close()

	convBody, _ := io.ReadAll(convResp.Body)
	var convData ymcdnConvertResponse
	if err := json.Unmarshal(convBody, &convData); err != nil || convData.Error != 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  false,
			"message": "Video tidak dapat diproses atau dilindungi hak cipta.",
		})
		return
	}

	// 5. Step 3: Check/Poll progress if necessary
	if convData.ProgressURL != "" {
		for i := 0; i < 5; i++ {
			time.Sleep(1 * time.Second)
			pReq, err := http.NewRequest("GET", convData.ProgressURL, nil)
			if err != nil {
				break
			}
			pReq.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
			pReq.Header.Set("Origin", "https://id.ytmp3.mobi")
			pReq.Header.Set("Referer", "https://id.ytmp3.mobi/")

			pResp, err := client.Do(pReq)
			if err == nil && pResp.StatusCode == http.StatusOK {
				var pData ymcdnProgressResponse
				pBody, _ := io.ReadAll(pResp.Body)
				pResp.Body.Close()
				_ = json.Unmarshal(pBody, &pData)
				if pData.Progress == 3 || pData.Percent == 100 {
					break
				}
			}
		}
	}

	title := convData.Title
	if title == "" {
		title = fmt.Sprintf("Media_%s", videoID)
	}

	// Internal proxy download URL & internal thumbnail URL
	downloadURL := fmt.Sprintf("/api/proxy/public/tools/youtube/download?hash=%s&vid=%s&format=%s&title=%s",
		convData.Hash, videoID, format, url.QueryEscape(title))
	thumbnailURL := fmt.Sprintf("/api/proxy/public/tools/youtube/thumbnail?vid=%s", videoID)

	c.JSON(http.StatusOK, gin.H{
		"status": true,
		"data": gin.H{
			"title":        title,
			"format":       format,
			"video_id":     videoID,
			"download_url": downloadURL,
			"thumbnail":    thumbnailURL,
		},
	})
}

// Download proxies and streams the media file directly to the client browser
func (ctrl *YouTubeToolController) Download(c *gin.Context) {
	hash := strings.TrimSpace(c.Query("hash"))
	videoID := strings.TrimSpace(c.Query("vid"))
	format := strings.ToLower(strings.TrimSpace(c.Query("format")))
	title := strings.TrimSpace(c.Query("title"))

	if format != "mp3" && format != "mp4" {
		format = "mp4"
	}

	if hash == "" || videoID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  false,
			"message": "Parameter unduhan tidak lengkap.",
		})
		return
	}

	if title == "" {
		title = fmt.Sprintf("video_%s", videoID)
	}

	// Sanitize filename for Content-Disposition
	cleanTitle := regexp.MustCompile(`[^\w\s\.-]`).ReplaceAllString(title, "")
	cleanTitle = strings.TrimSpace(cleanTitle)
	if cleanTitle == "" {
		cleanTitle = "media"
	}
	fileName := fmt.Sprintf("%s.%s", cleanTitle, format)

	targetURL := fmt.Sprintf("https://ydl.ymcdn.org/api/v1/download/%s/%s", hash, videoID)
	req, err := http.NewRequest("GET", targetURL, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  false,
			"message": "Gagal menyiapkan pengunduhan berkas.",
		})
		return
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Origin", "https://id.ytmp3.mobi")
	req.Header.Set("Referer", "https://id.ytmp3.mobi/")
	req.Header.Set("Accept", "*/*")

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode < 200 || resp.StatusCode >= 300 {
		c.JSON(http.StatusBadGateway, gin.H{
			"status":  false,
			"message": "Gagal mengunduh berkas media dari server gateway.",
		})
		return
	}
	defer resp.Body.Close()

	// Set binary stream headers
	if format == "mp3" {
		c.Header("Content-Type", "audio/mpeg")
	} else {
		c.Header("Content-Type", "video/mp4")
	}

	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, fileName))
	if resp.ContentLength > 0 {
		c.Header("Content-Length", fmt.Sprintf("%d", resp.ContentLength))
	}
	c.Header("Cache-Control", "no-cache, no-store, must-revalidate")

	c.Status(http.StatusOK)
	_, _ = io.Copy(c.Writer, resp.Body)
}

// Thumbnail proxies the video thumbnail image
func (ctrl *YouTubeToolController) Thumbnail(c *gin.Context) {
	videoID := strings.TrimSpace(c.Query("vid"))
	if videoID == "" {
		c.Status(http.StatusBadRequest)
		return
	}

	targetURL := fmt.Sprintf("https://img.youtube.com/vi/%s/hqdefault.jpg", videoID)
	resp, err := http.Get(targetURL)
	if err != nil || resp.StatusCode != http.StatusOK {
		c.Status(http.StatusNotFound)
		return
	}
	defer resp.Body.Close()

	c.Header("Content-Type", "image/jpeg")
	c.Header("Cache-Control", "public, max-age=86400")
	c.Status(http.StatusOK)
	_, _ = io.Copy(c.Writer, resp.Body)
}

// extractYouTubeID parses 11-char video ID
func extractYouTubeID(input string) string {
	input = strings.TrimSpace(input)
	if len(input) == 11 && regexp.MustCompile(`^[\w-]{11}$`).MatchString(input) {
		return input
	}

	re := regexp.MustCompile(`(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})`)
	matches := re.FindStringSubmatch(input)
	if len(matches) > 1 {
		return matches[1]
	}

	return ""
}
