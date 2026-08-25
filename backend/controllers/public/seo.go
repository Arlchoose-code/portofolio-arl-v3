package public

import (
	"fmt"
	"net/http"
	"strings"

	"portfolio-arl-backend/config"
	"portfolio-arl-backend/models"
	"portfolio-arl-backend/structs"
	"github.com/gin-gonic/gin"
)

type SeoController struct{}

func NewSeoController() *SeoController {
	return &SeoController{}
}

func (ctrl *SeoController) GetSeoByPath(c *gin.Context) {
	path := c.Query("path")
	if path == "" {
		path = "/"
	}

	var site models.SiteSetting
	_ = config.DB.First(&site).Error

	siteName := strings.TrimSpace(site.SiteName)
	if siteName == "" {
		siteName = "Syahril Haryono"
	}
	separator := strings.TrimSpace(site.TitleSeparator)
	if separator == "" {
		separator = "|"
	}
	tagline := strings.TrimSpace(site.Tagline)
	if tagline == "" {
		tagline = "Full Stack Developer & AI Enthusiast"
	}

	// Cascading OG Image: Custom -> Default OG -> Logo -> Favicon
	ogImage := site.OgImageDefaultURL
	if ogImage == "" {
		ogImage = site.LogoURL
	}
	if ogImage == "" {
		ogImage = site.FaviconURL
	}

	canonical := path

	var autoPageName string
	var defaultPathDesc string

	switch path {
	case "/":
		autoPageName = ""
		defaultPathDesc = "Portofolio profesional Syahril Haryono — Full Stack Developer & AI Systems Engineer. Mengembangkan arsitektur backend Go berkinerja tinggi, frontend Next.js reaktif, dan sistem AI terintegrasi."
	case "/projects":
		autoPageName = "Proyek"
		defaultPathDesc = "Eksplorasi portofolio proyek perangkat lunak, sistem backend terdistribusi, aplikasi web interaktif, dan integrasi AI yang dikembangkan oleh Syahril Haryono."
	case "/certificates":
		autoPageName = "Sertifikasi"
		defaultPathDesc = "Daftar lisensi dan sertifikasi profesional resmi di bidang Cloud Computing, Full Stack Development, dan Artificial Intelligence dari institusi teknologi terkemuka."
	case "/experiences":
		autoPageName = "Pengalaman Kerja"
		defaultPathDesc = "Rekam jejak pengalaman kerja profesional, kontribusi teknis, dan pencapaian karier Syahril Haryono dalam rekayasa perangkat lunak dan arsitektur sistem."
	case "/skills":
		autoPageName = "Keahlian Teknis"
		defaultPathDesc = "Penguasaan teknologi modern meliputi bahasa pemrograman (Go, Rust, TypeScript), framework web (Next.js, Gin), arsitektur basis data, serta implementasi model AI & LLM."
	case "/educations":
		autoPageName = "Pendidikan"
		defaultPathDesc = "Riwayat pendidikan akademis di Universitas Negeri Jakarta serta pengalaman kepemimpinan dalam berbagai organisasi teknologi dan kemahasiswaan."
	case "/about":
		autoPageName = "Tentang Saya"
		defaultPathDesc = "Kenali lebih dalam latar belakang, visi rekayasa perangkat lunak, dedikasi riset teknologi cerdas, dan profil profesional Syahril Haryono."
	case "/privacy-policy":
		autoPageName = "Kebijakan Privasi"
		defaultPathDesc = "Kebijakan privasi dan standar perlindungan data pengunjung, enkripsi informasi, serta transparansi operasional situs portofolio Syahril Haryono."
	case "/terms":
		autoPageName = "Syarat & Ketentuan"
		defaultPathDesc = "Syarat dan ketentuan resmi penggunaan situs portofolio, hak kekayaan intelektual kode sumber, dan panduan etika interaksi dengan asisten AI."
	default:
		cleanPath := strings.Trim(path, "/")
		autoPageName = strings.ReplaceAll(cleanPath, "-", " ")
		defaultPathDesc = site.Description
	}

	var seo models.SeoSetting
	hasCustom := config.DB.Where("path = ?", path).First(&seo).Error == nil

	if hasCustom && seo.MetaTitle != "" {
		metaTitle := seo.MetaTitle
		if path != "/" && !strings.Contains(metaTitle, separator) && !strings.Contains(metaTitle, siteName) {
			metaTitle = fmt.Sprintf("%s %s %s", metaTitle, separator, siteName)
		}

		customOg := seo.OgImageURL
		if customOg == "" {
			customOg = ogImage
		}

		customDesc := seo.MetaDescription
		if customDesc == "" {
			customDesc = defaultPathDesc
		}

		seo.MetaTitle = metaTitle
		seo.MetaDescription = customDesc
		seo.OgTitle = metaTitle
		seo.OgDescription = customDesc
		seo.OgImageURL = customOg
		if seo.Canonical == "" {
			seo.Canonical = canonical
		}

		c.JSON(http.StatusOK, structs.SuccessResponse("SEO setting retrieved", seo))
		return
	}

	var fullTitle string
	if path == "/" {
		fullTitle = fmt.Sprintf("%s %s %s", siteName, separator, tagline)
	} else {
		fullTitle = fmt.Sprintf("%s %s %s", autoPageName, separator, siteName)
	}

	fallback := models.SeoSetting{
		Path:            path,
		MetaTitle:       fullTitle,
		MetaDescription: defaultPathDesc,
		OgTitle:         fullTitle,
		OgDescription:   defaultPathDesc,
		OgImageURL:      ogImage,
		Canonical:       canonical,
	}

	c.JSON(http.StatusOK, structs.SuccessResponse("Default SEO retrieved", fallback))
}
