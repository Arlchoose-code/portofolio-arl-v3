package public

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"portfolio-arl-backend/config"
	"portfolio-arl-backend/models"
	"portfolio-arl-backend/structs"
	"github.com/gin-gonic/gin"
)

type GameToolController struct{}

func NewGameToolController() *GameToolController {
	return &GameToolController{}
}

// GetToolSettings returns all public tool statuses (on/off)
func (ctrl *GameToolController) GetToolSettings(c *gin.Context) {
	db := config.DB
	var settings []models.ToolSetting
	if err := db.Order("id ASC").Find(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  false,
			"message": "Gagal memuat pengaturan tools.",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": true,
		"data":   settings,
	})
}

// ListGames returns active game tools
func (ctrl *GameToolController) ListGames(c *gin.Context) {
	db := config.DB

	// Check if game-checker tool is enabled globally
	var toolSetting models.ToolSetting
	if err := db.Where("slug = ?", "game-checker").First(&toolSetting).Error; err == nil {
		if !toolSetting.IsEnabled {
			c.JSON(http.StatusForbidden, gin.H{
				"status":  false,
				"message": "Fitur Game Checker sedang dinonaktifkan oleh administrator.",
			})
			return
		}
	}

	var games []models.GameTool
	if err := db.Where("is_active = ?", true).Order("sort_order ASC, id ASC").Find(&games).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  false,
			"message": "Gagal memuat daftar game.",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": true,
		"data":   games,
	})
}

// GetGameBySlug returns single active game by slug or game code
func (ctrl *GameToolController) GetGameBySlug(c *gin.Context) {
	db := config.DB
	slug := c.Param("slug")

	var game models.GameTool
	if err := db.Where("(slug = ? OR game_code = ?) AND is_active = ?", slug, slug, true).First(&game).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  false,
			"message": "Game tidak ditemukan atau sedang tidak aktif.",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": true,
		"data":   game,
	})
}

// TokopediaResponse maps Tokopedia Voucher Game prepare response
type TokopediaPrepareResponse struct {
	StatusCode int    `json:"statusCode"`
	Message    string `json:"message"`
	Data       string `json:"data"`
	Error      string `json:"error"`
}

// CheckNickname proxies request to Tokopedia Voucher Game prepare API
func (ctrl *GameToolController) CheckNickname(c *gin.Context) {
	db := config.DB

	// 1. Guard check: Is the overall game-checker tool enabled?
	var toolSetting models.ToolSetting
	if err := db.Where("slug = ?", "game-checker").First(&toolSetting).Error; err == nil {
		if !toolSetting.IsEnabled {
			c.JSON(http.StatusForbidden, gin.H{
				"status":  false,
				"message": "Layanan Game Checker sedang dinonaktifkan oleh administrator.",
			})
			return
		}
	}

	var query structs.GameCheckQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  false,
			"message": "Parameter game_code dan user_id wajib diisi.",
		})
		return
	}

	gameCode := strings.TrimSpace(query.GameCode)
	userId := strings.TrimSpace(query.UserId)
	zoneId := strings.TrimSpace(query.ZoneId)

	if gameCode == "" || userId == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  false,
			"message": "Game Code dan User ID tidak boleh kosong.",
		})
		return
	}

	// 2. Guard check: Is this specific game active in the database?
	var game models.GameTool
	if err := db.Where("game_code = ? OR slug = ? OR (game_code = 'FREE_FIRE' AND ? = 'FREEFIRE') OR (game_code = 'FREEFIRE' AND ? = 'FREE_FIRE') OR (game_code = 'ARENA_OF_VALOR' AND ? = 'AOV') OR (game_code = 'AOV' AND ? = 'ARENA_OF_VALOR')", gameCode, gameCode, gameCode, gameCode, gameCode, gameCode).First(&game).Error; err != nil || !game.IsActive {
		c.JSON(http.StatusForbidden, gin.H{
			"status":  false,
			"message": "Layanan verifikasi untuk game ini sedang tidak aktif atau dinonaktifkan.",
		})
		return
	}

	// Normalize Tokopedia Voucher Game API code
	targetGameCode := game.GameCode
	if targetGameCode == "FREE_FIRE" {
		targetGameCode = "FREEFIRE"
	} else if targetGameCode == "ARENA_OF_VALOR" {
		targetGameCode = "AOV"
	}

	// 3. Build Tokopedia URL
	apiURL := fmt.Sprintf(
		"https://www.tokopedia.com/digital/voucher-game/v1/order/prepare/%s?userId=%s",
		url.PathEscape(targetGameCode),
		url.QueryEscape(userId),
	)
	if zoneId != "" {
		apiURL += fmt.Sprintf("&zoneId=%s", url.QueryEscape(zoneId))
	}

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  false,
			"message": "Gagal membuat request pemeriksaan akun.",
		})
		return
	}

	// Set Browser User-Agent to prevent bot detection
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "application/json, text/plain, */*")
	req.Header.Set("Referer", "https://www.tokopedia.com/digital/voucher-game")

	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{
			"status":  false,
			"message": "Gagal terhubung ke gateway verifikasi game.",
		})
		return
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  false,
			"message": "Gagal membaca respon dari server game.",
		})
		return
	}

	var topoResp TokopediaPrepareResponse
	if err := json.Unmarshal(bodyBytes, &topoResp); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{
			"status":  false,
			"message": "Format respon tidak valid dari gateway.",
		})
		return
	}

	// Check if success
	if resp.StatusCode == http.StatusOK && topoResp.Data != "" {
		c.JSON(http.StatusOK, gin.H{
			"status": true,
			"data": structs.GameCheckResponse{
				GameCode: gameCode,
				GameName: game.Name,
				UserId:   userId,
				ZoneId:   zoneId,
				Nickname: topoResp.Data,
			},
		})
		return
	}

	// Build friendly error message tailored to the game's actual fields
	uLabel := strings.TrimSpace(game.UserIdLabel)
	if uLabel == "" {
		uLabel = "User ID"
	}
	zLabel := strings.TrimSpace(game.ZoneIdLabel)
	if zLabel == "" {
		if game.HasServerList {
			zLabel = "Server"
		} else {
			zLabel = "Zone ID"
		}
	}

	errMsg := fmt.Sprintf("Akun tidak ditemukan. Periksa kembali %s Anda.", uLabel)
	if game.HasZoneId {
		errMsg = fmt.Sprintf("Akun tidak ditemukan. Periksa kembali %s dan %s Anda.", uLabel, zLabel)
	}

	// Always use clean Indonesian tailored message for 404 / 400 / account not found errors
	lowerMsg := strings.ToLower(topoResp.Message)
	if resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusBadRequest ||
		strings.Contains(lowerMsg, "unknown") ||
		strings.Contains(lowerMsg, "invalid") ||
		strings.Contains(lowerMsg, "not found") ||
		strings.Contains(lowerMsg, "not recognized") ||
		strings.Contains(lowerMsg, "failed with status code") ||
		strings.Contains(lowerMsg, "sku error") {
		// Use tailored clean Indonesian errMsg
	} else if topoResp.Message != "" && !strings.Contains(topoResp.Message, "Success") {
		errMsg = topoResp.Message
	}

	c.JSON(http.StatusNotFound, gin.H{
		"status":  false,
		"message": errMsg,
	})
}
