package admin

import (
	"math"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"portfolio-arl-backend/config"
	"portfolio-arl-backend/models"
	"portfolio-arl-backend/services"
	"portfolio-arl-backend/structs"
	"github.com/gin-gonic/gin"
)

var slugCleanRegex = regexp.MustCompile(`[^a-z0-9\-]`)
var slugDashRegex = regexp.MustCompile(`\-+`)

func cleanToolSlug(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = strings.ReplaceAll(s, " ", "-")
	s = slugCleanRegex.ReplaceAllString(s, "")
	s = slugDashRegex.ReplaceAllString(s, "-")
	return strings.Trim(s, "-")
}

type GameToolController struct{}

func NewGameToolController() *GameToolController {
	return &GameToolController{}
}

// ListGameTools lists all games with pagination & search
func (ctrl *GameToolController) ListGameTools(c *gin.Context) {
	db := config.DB
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	search := strings.TrimSpace(c.Query("search"))

	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	query := db.Model(&models.GameTool{})
	if search != "" {
		s := "%" + search + "%"
		query = query.Where("name LIKE ? OR game_code LIKE ? OR slug LIKE ?", s, s, s)
	}
	if category := strings.TrimSpace(c.Query("category")); category != "" && category != "all" {
		query = query.Where("category = ?", category)
	}

	var total int64
	query.Count(&total)

	var games []models.GameTool
	offset := (page - 1) * perPage
	if err := query.Order("sort_order ASC, id ASC").Limit(perPage).Offset(offset).Find(&games).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  false,
			"message": "Gagal mengambil data game tools.",
		})
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(perPage)))
	if totalPages < 1 {
		totalPages = 1
	}

	c.JSON(http.StatusOK, gin.H{
		"status": true,
		"data":   games,
		"meta": gin.H{
			"page":        page,
			"per_page":    perPage,
			"total":       total,
			"total_pages": totalPages,
		},
	})
}

// GetGameTool gets single game by ID
func (ctrl *GameToolController) GetGameTool(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": false, "message": "ID tidak valid."})
		return
	}

	db := config.DB
	var game models.GameTool
	if err := db.First(&game, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": false, "message": "Game tidak ditemukan."})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": true,
		"data":   game,
	})
}

// CreateGameTool creates new game configuration
func (ctrl *GameToolController) CreateGameTool(c *gin.Context) {
	var req structs.CreateGameToolRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  false,
			"message": "Data form tidak valid: " + err.Error(),
		})
		return
	}

	db := config.DB

	// Generate slug if not provided
	slug := strings.TrimSpace(req.Slug)
	if slug == "" {
		slug = strings.ToLower(strings.ReplaceAll(req.Name, " ", "-"))
		slug = strings.ReplaceAll(slug, ":", "")
	}

	// Format game code uppercase
	gameCode := strings.ToUpper(strings.TrimSpace(req.GameCode))

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	userIdLabel := strings.TrimSpace(req.UserIdLabel)
	if userIdLabel == "" {
		userIdLabel = "User ID"
	}

	zoneIdLabel := strings.TrimSpace(req.ZoneIdLabel)
	if zoneIdLabel == "" {
		zoneIdLabel = "Zone ID"
	}

	category := strings.TrimSpace(req.Category)
	if category == "" {
		category = "MOBA"
	}

	game := models.GameTool{
		Name:              strings.TrimSpace(req.Name),
		Slug:              slug,
		GameCode:          gameCode,
		IconURL:           strings.TrimSpace(req.IconURL),
		Description:       strings.TrimSpace(req.Description),
		Category:          category,
		UserIdLabel:       userIdLabel,
		UserIdPlaceholder: strings.TrimSpace(req.UserIdPlaceholder),
		HasZoneId:         req.HasZoneId,
		ZoneIdLabel:       zoneIdLabel,
		ZoneIdPlaceholder: strings.TrimSpace(req.ZoneIdPlaceholder),
		HasServerList:     req.HasServerList,
		ServerOptions:     strings.TrimSpace(req.ServerOptions),
		GuideText:         strings.TrimSpace(req.GuideText),
		IsActive:          isActive,
		SortOrder:         req.SortOrder,
	}

	if err := db.Create(&game).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  false,
			"message": "Gagal menyimpan game baru: " + err.Error(),
		})
		return
	}

	_ = services.Revalidate.InsertJob(config.DB, []string{"/tools", "/"})

	c.JSON(http.StatusCreated, gin.H{
		"status":  true,
		"message": "Game berhasil ditambahkan.",
		"data":    game,
	})
}

// UpdateGameTool updates game configuration
func (ctrl *GameToolController) UpdateGameTool(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": false, "message": "ID tidak valid."})
		return
	}

	var req structs.UpdateGameToolRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  false,
			"message": "Data form tidak valid: " + err.Error(),
		})
		return
	}

	db := config.DB
	var game models.GameTool
	if err := db.First(&game, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": false, "message": "Game tidak ditemukan."})
		return
	}

	if req.Name != "" {
		game.Name = strings.TrimSpace(req.Name)
	}
	if req.Slug != "" {
		game.Slug = strings.TrimSpace(req.Slug)
	}
	if req.GameCode != "" {
		game.GameCode = strings.ToUpper(strings.TrimSpace(req.GameCode))
	}
	game.IconURL = strings.TrimSpace(req.IconURL)
	game.Description = strings.TrimSpace(req.Description)
	if req.Category != "" {
		game.Category = strings.TrimSpace(req.Category)
	}

	if req.UserIdLabel != "" {
		game.UserIdLabel = strings.TrimSpace(req.UserIdLabel)
	}
	game.UserIdPlaceholder = strings.TrimSpace(req.UserIdPlaceholder)

	if req.HasZoneId != nil {
		game.HasZoneId = *req.HasZoneId
	}
	if req.ZoneIdLabel != "" {
		game.ZoneIdLabel = strings.TrimSpace(req.ZoneIdLabel)
	}
	game.ZoneIdPlaceholder = strings.TrimSpace(req.ZoneIdPlaceholder)

	if req.HasServerList != nil {
		game.HasServerList = *req.HasServerList
	}
	game.ServerOptions = strings.TrimSpace(req.ServerOptions)
	game.GuideText = strings.TrimSpace(req.GuideText)

	if req.IsActive != nil {
		game.IsActive = *req.IsActive
	}
	if req.SortOrder != nil {
		game.SortOrder = *req.SortOrder
	}

	if err := db.Save(&game).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  false,
			"message": "Gagal memperbarui game: " + err.Error(),
		})
		return
	}

	_ = services.Revalidate.InsertJob(config.DB, []string{"/tools", "/"})

	c.JSON(http.StatusOK, gin.H{
		"status":  true,
		"message": "Konfigurasi game berhasil diperbarui.",
		"data":    game,
	})
}

// DeleteGameTool deletes game
func (ctrl *GameToolController) DeleteGameTool(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": false, "message": "ID tidak valid."})
		return
	}

	db := config.DB
	var game models.GameTool
	if err := db.First(&game, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": false, "message": "Game tidak ditemukan."})
		return
	}

	if err := db.Delete(&game).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  false,
			"message": "Gagal menghapus game: " + err.Error(),
		})
		return
	}

	_ = services.Revalidate.InsertJob(config.DB, []string{"/tools", "/"})

	c.JSON(http.StatusOK, gin.H{
		"status":  true,
		"message": "Game berhasil dihapus.",
	})
}

// ToggleActive toggles active state
func (ctrl *GameToolController) ToggleActive(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": false, "message": "ID tidak valid."})
		return
	}

	db := config.DB
	var game models.GameTool
	if err := db.First(&game, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": false, "message": "Game tidak ditemukan."})
		return
	}

	game.IsActive = !game.IsActive
	if err := db.Save(&game).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  false,
			"message": "Gagal mengubah status game.",
		})
		return
	}

	_ = services.Revalidate.InsertJob(config.DB, []string{"/tools", "/"})

	c.JSON(http.StatusOK, gin.H{
		"status":  true,
		"message": "Status game berhasil diperbarui.",
		"data": gin.H{
			"id":        game.ID,
			"is_active": game.IsActive,
		},
	})
}

// ListToolSettings lists all global tool settings
func (ctrl *GameToolController) ListToolSettings(c *gin.Context) {
	db := config.DB
	var settings []models.ToolSetting
	if err := db.Order("id ASC").Find(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  false,
			"message": "Gagal mengambil data pengaturan tools.",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": true,
		"data":   settings,
	})
}

// ToggleToolSetting toggles enabled state of a specific tool
func (ctrl *GameToolController) ToggleToolSetting(c *gin.Context) {
	slug := strings.TrimSpace(c.Param("slug"))
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"status": false, "message": "Slug tool tidak valid."})
		return
	}

	db := config.DB
	var setting models.ToolSetting
	if err := db.Where("slug = ?", slug).First(&setting).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": false, "message": "Pengaturan tool tidak ditemukan."})
		return
	}

	setting.IsEnabled = !setting.IsEnabled
	if err := db.Save(&setting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  false,
			"message": "Gagal mengubah status tool.",
		})
		return
	}

	_ = services.Revalidate.InsertJob(config.DB, []string{"/tools", "/"})

	c.JSON(http.StatusOK, gin.H{
		"status":  true,
		"message": "Status tool berhasil diperbarui.",
		"data": gin.H{
			"slug":       setting.Slug,
			"is_enabled": setting.IsEnabled,
		},
	})
}

// ToggleToolPopular toggles popular badge of a specific tool
func (ctrl *GameToolController) ToggleToolPopular(c *gin.Context) {
	slug := strings.TrimSpace(c.Param("slug"))
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"status": false, "message": "Slug tool tidak valid."})
		return
	}

	db := config.DB
	var setting models.ToolSetting
	if err := db.Where("slug = ?", slug).First(&setting).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": false, "message": "Pengaturan tool tidak ditemukan."})
		return
	}

	setting.IsPopular = !setting.IsPopular
	if err := db.Save(&setting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  false,
			"message": "Gagal mengubah status popular tool.",
		})
		return
	}

	_ = services.Revalidate.InsertJob(config.DB, []string{"/tools", "/"})

	c.JSON(http.StatusOK, gin.H{
		"status":  true,
		"message": "Status popular tool berhasil diperbarui.",
		"data": gin.H{
			"slug":       setting.Slug,
			"is_popular": setting.IsPopular,
		},
	})
}

// UpdateToolSetting updates tool name, description, category, badge, and sort order
func (ctrl *GameToolController) UpdateToolSetting(c *gin.Context) {
	slug := strings.TrimSpace(c.Param("slug"))
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"status": false, "message": "Slug tool tidak valid."})
		return
	}

	var req structs.UpdateToolSettingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  false,
			"message": "Data tidak valid: " + err.Error(),
		})
		return
	}

	db := config.DB
	var setting models.ToolSetting
	if err := db.Where("slug = ?", slug).First(&setting).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": false, "message": "Pengaturan tool tidak ditemukan."})
		return
	}

	if setting.ToolType == "" {
		setting.ToolType = slug
	}

	if req.ToolType != "" {
		setting.ToolType = strings.TrimSpace(req.ToolType)
	}

	if req.Name != "" {
		setting.Name = strings.TrimSpace(req.Name)
	}

	// Update slug if requested
	newSlug := strings.TrimSpace(req.Slug)
	if newSlug != "" && newSlug != setting.Slug {
		cleanSlug := cleanToolSlug(newSlug)
		var checkSlug models.ToolSetting
		if err := db.Where("slug = ? AND id != ?", cleanSlug, setting.ID).First(&checkSlug).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  false,
				"message": "Slug '" + cleanSlug + "' sudah digunakan oleh tool lain.",
			})
			return
		}
		setting.Slug = cleanSlug
	}

	if req.Description != "" {
		setting.Description = strings.TrimSpace(req.Description)
	}
	if req.Category != "" {
		setting.Category = strings.TrimSpace(req.Category)
	}
	if req.Icon != "" {
		setting.Icon = strings.TrimSpace(req.Icon)
	}
	if req.Badge != "" {
		setting.Badge = strings.TrimSpace(req.Badge)
	}
	if req.BadgeColor != "" {
		setting.BadgeColor = strings.TrimSpace(req.BadgeColor)
	}
	if req.IsEnabled != nil {
		setting.IsEnabled = *req.IsEnabled
	}
	if req.IsPopular != nil {
		setting.IsPopular = *req.IsPopular
	}
	if req.SortOrder != nil {
		setting.SortOrder = *req.SortOrder
	}

	if err := db.Save(&setting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  false,
			"message": "Gagal menyimpan perubahan tool: " + err.Error(),
		})
		return
	}

	_ = services.Revalidate.InsertJob(config.DB, []string{"/tools", "/"})

	c.JSON(http.StatusOK, gin.H{
		"status":  true,
		"message": "Informasi tool berhasil diperbarui.",
		"data":    setting,
	})
}


