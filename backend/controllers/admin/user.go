package admin

import (
	"net/http"
	"strconv"
	"strings"

	"portfolio-arl-backend/config"
	"portfolio-arl-backend/models"
	"portfolio-arl-backend/services"
	"portfolio-arl-backend/structs"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type UserController struct{}

func NewUserController() *UserController {
	return &UserController{}
}

func (ctrl *UserController) ListUsers(c *gin.Context) {
	params := services.Pagination.GetPaginationParams(c)
	role := strings.TrimSpace(c.Query("role"))

	query := config.DB.Model(&models.User{})

	if params.Search != "" {
		s := "%" + params.Search + "%"
		query = query.Where("name LIKE ? OR email LIKE ?", s, s)
	}

	if role != "" && role != "all" {
		query = query.Where("role = ?", role)
	}

	var total int64
	query.Count(&total)

	var users []models.User
	query.Scopes(services.Pagination.Paginate(params)).
		Order("id ASC").
		Find(&users)

	var responseList []structs.UserResponse
	for _, u := range users {
		responseList = append(responseList, structs.UserResponse{
			ID:        u.ID,
			Name:      u.Name,
			Email:     u.Email,
			Role:      u.Role,
			CreatedAt: u.CreatedAt,
			UpdatedAt: u.UpdatedAt,
		})
	}

	meta := services.Pagination.BuildMeta(params, total)
	c.JSON(http.StatusOK, structs.SuccessWithMeta("Users retrieved successfully", responseList, meta))
}

func (ctrl *UserController) GetUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse("Invalid ID"))
		return
	}

	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("User not found"))
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse("User retrieved", structs.UserResponse{
		ID:        user.ID,
		Name:      user.Name,
		Email:     user.Email,
		Role:      user.Role,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}))
}

func (ctrl *UserController) CreateUser(c *gin.Context) {
	var req structs.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Data pengguna tidak valid", nil))
		return
	}

	name := strings.TrimSpace(req.Name)
	email := strings.ToLower(strings.TrimSpace(req.Email))
	role := "admin"

	var count int64
	config.DB.Model(&models.User{}).Where("email = ?", email).Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, structs.ErrorResponse("Alamat email sudah digunakan oleh pengguna lain."))
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Gagal mengenkripsi kata sandi"))
		return
	}

	user := models.User{
		Name:     name,
		Email:    email,
		Password: string(hashedPassword),
		Role:     role,
	}

	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Gagal membuat pengguna baru"))
		return
	}

	c.JSON(http.StatusCreated, structs.SuccessResponse("Pengguna berhasil ditambahkan", structs.UserResponse{
		ID:        user.ID,
		Name:      user.Name,
		Email:     user.Email,
		Role:      user.Role,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}))
}

func (ctrl *UserController) UpdateUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse("Invalid ID"))
		return
	}

	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("User not found"))
		return
	}

	var req structs.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ValidationErrorResponse("Data pengguna tidak valid", nil))
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))

	// If email is changed, check uniqueness
	if email != user.Email {
		var count int64
		config.DB.Model(&models.User{}).Where("email = ? AND id != ?", email, user.ID).Count(&count)
		if count > 0 {
			c.JSON(http.StatusConflict, structs.ErrorResponse("Alamat email sudah digunakan oleh pengguna lain."))
			return
		}
	}

	user.Name = strings.TrimSpace(req.Name)
	user.Email = email
	user.Role = "admin"

	// Update password if provided
	if req.Password != nil && strings.TrimSpace(*req.Password) != "" {
		pwd := strings.TrimSpace(*req.Password)
		if len(pwd) < 6 {
			c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse("Kata sandi minimal 6 karakter."))
			return
		}
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(pwd), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Gagal mengenkripsi kata sandi"))
			return
		}
		user.Password = string(hashedPassword)
	}

	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Gagal memperbarui pengguna"))
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse("Data pengguna berhasil diperbarui", structs.UserResponse{
		ID:        user.ID,
		Name:      user.Name,
		Email:     user.Email,
		Role:      user.Role,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}))
}

func (ctrl *UserController) DeleteUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse("Invalid ID"))
		return
	}

	// Get current user ID from context
	currentUserID, _ := c.Get("user_id")
	if currentUserID != nil && currentUserID.(uint) == uint(id) {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse("Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif."))
		return
	}

	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("User not found"))
		return
	}

	// Check total admin count to avoid deleting the only admin
	var adminCount int64
	config.DB.Model(&models.User{}).Where("role = ?", "admin").Count(&adminCount)
	if user.Role == "admin" && adminCount <= 1 {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse("Tidak dapat menghapus admin utama satu-satunya."))
		return
	}

	if err := config.DB.Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse("Gagal menghapus pengguna"))
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse("Pengguna berhasil dihapus", nil))
}
