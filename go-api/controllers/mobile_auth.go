package controllers

import (
    "crypto/rand"
    "encoding/hex"
    "fmt"
    "net/http"
    "os"
    "path/filepath"
    "strings"
    "time"
    "github.com/gin-gonic/gin"
    "golang.org/x/crypto/bcrypt"
    "gorm.io/gorm"
    "portal-api/config"
    "portal-api/models"
)

type MobileAuthController struct {
    db *gorm.DB
}

func NewMobileAuthController() *MobileAuthController {
    return &MobileAuthController{
        db: config.GetDB(),
    }
}

// Login function - setara dengan login() di Laravel
func (c *MobileAuthController) Login(ctx *gin.Context) {
    var loginRequest struct {
        Identifier  string `json:"identifier" binding:"required"`
        Password    string `json:"password" binding:"required"`
        DeviceName  string `json:"device_name"`
    }

    if err := ctx.ShouldBindJSON(&loginRequest); err != nil {
        ctx.JSON(http.StatusBadRequest, gin.H{
            "status":  "error",
            "message": "Invalid request data",
        })
        return
    }

    // Deteksi apakah identifier adalah email atau ID
    var client models.Client
    query := c.db.Table("tblclients")
    
    // Cek apakah identifier adalah email
    if strings.Contains(loginRequest.Identifier, "@") {
        query = query.Where("email = ?", loginRequest.Identifier)
    } else {
        query = query.Where("id = ?", loginRequest.Identifier)
    }
    
    if err := query.First(&client).Error; err != nil {
        ctx.JSON(http.StatusUnauthorized, gin.H{
            "status":  "error",
            "message": "ID Pelanggan/Email atau password salah",
        })
        return
    }

    // Cek password
    if err := bcrypt.CompareHashAndPassword([]byte(client.Password), []byte(loginRequest.Password)); err != nil {
        ctx.JSON(http.StatusUnauthorized, gin.H{
            "status":  "error",
            "message": "ID Pelanggan/Email atau password salah",
        })
        return
    }

    // Generate token sederhana (setara dengan Str::random(60))
    token := generateRandomToken(60)
    expiresAt := time.Now().AddDate(100, 0, 0) // 100 tahun ke depan (forever)

    // Simpan token di tabel api_tokens
    c.db.Exec(`
        INSERT INTO api_tokens (client_id, token, created_at, expires_at) 
        VALUES (?, ?, ?, ?) 
        ON DUPLICATE KEY UPDATE 
        token = VALUES(token), 
        created_at = VALUES(created_at), 
        expires_at = VALUES(expires_at)
    `, client.ID, token, time.Now(), expiresAt)

    ctx.JSON(http.StatusOK, gin.H{
        "status":  "success",
        "message": "Login berhasil",
        "data": gin.H{
            "token":      token,
            "expires_at": expiresAt.Format(time.RFC3339),
            "client": gin.H{
                "id":      client.ID,
                "name":    client.Firstname + " " + client.Lastname,
                "email":   client.Email,
                "phone":   client.Phonenumber,
                "address": client.Address1,
                "status":  client.Status,
            },
        },
    })
}

// GetAllClients function - setara dengan getAllClients()
func (c *MobileAuthController) GetAllClients(ctx *gin.Context) {
    var clients []gin.H
    
    c.db.Table("tblclients").
        Select("id, firstname, lastname, email, status, password").
        Limit(50).
        Find(&clients)

    ctx.JSON(http.StatusOK, gin.H{
        "status": "success",
        "data": gin.H{
            "clients": clients,
        },
    })
}

// GetClientById function - setara dengan getClientById()
func (c *MobileAuthController) GetClientById(ctx *gin.Context) {
    // Ambil token dari header
    token := ctx.GetHeader("Authorization")
    if token == "" {
        ctx.JSON(http.StatusUnauthorized, gin.H{
            "status":  "error",
            "message": "Token tidak ditemukan",
        })
        return
    }

    // Hapus "Bearer " prefix
    token = strings.TrimPrefix(token, "Bearer ")

    // Cari client_id berdasarkan token
    var tokenData struct {
        ClientID uint `json:"client_id"`
    }
    if err := c.db.Table("api_tokens").
        Select("client_id").
        Where("token = ? AND expires_at > ?", token, time.Now()).
        First(&tokenData).Error; err != nil {
        ctx.JSON(http.StatusUnauthorized, gin.H{
            "status":  "error",
            "message": "Token tidak valid atau sudah kadaluarsa",
        })
        return
    }

    // Ambil data client
    var client models.Client
    if err := c.db.Table("tblclients").
        Where("id = ?", tokenData.ClientID).
        First(&client).Error; err != nil {
        ctx.JSON(http.StatusNotFound, gin.H{
            "status":  "error",
            "message": "Client tidak ditemukan",
        })
        return
    }

    ctx.JSON(http.StatusOK, gin.H{
        "status": "success",
        "data": gin.H{
            "client": gin.H{
                "id":        client.ID,
                "firstname": client.Firstname,
                "lastname":  client.Lastname,
                "email":     client.Email,
                "address1":  client.Address1,
                "address2":  client.Address2,
                "city":      client.City,
                "state":     client.State,
                "postcode":  client.Postcode,
                "country":   client.Country,
                "phonenumber": client.Phonenumber,
                "company":   client.Companyname,
                "status":    client.Status,
                "created_at": client.Datecreated,
            },
        },
    })
}

// GetAllInvoices function - setara dengan getAllInvoices()
func (c *MobileAuthController) GetAllInvoices(ctx *gin.Context) {
    // Ambil token dari header
    token := strings.TrimPrefix(ctx.GetHeader("Authorization"), "Bearer ")

    // Cari client_id berdasarkan token
    var tokenData struct {
        ClientID uint `json:"client_id"`
    }
    if err := c.db.Table("api_tokens").
        Select("client_id").
        Where("token = ? AND expires_at > ?", token, time.Now()).
        First(&tokenData).Error; err != nil {
        ctx.JSON(http.StatusUnauthorized, gin.H{
            "status":  "error",
            "message": "Token tidak valid atau sudah kadaluarsa",
        })
        return
    }

    // Ambil semua invoice dari client
    var invoices []gin.H
    c.db.Table("tblinvoices").
        Where("userid = ?", tokenData.ClientID).
        Order("date desc").
        Limit(50).
        Select("id, invoicenum, date, duedate, total, status, paymentmethod, subtotal, tax, tax2, notes").
        Find(&invoices)

    ctx.JSON(http.StatusOK, gin.H{
        "status": "success",
        "data": gin.H{
            "invoices": invoices,
        },
    })
}

// UploadFiles function - setara dengan uploadFiles()
func (c *MobileAuthController) UploadFiles(ctx *gin.Context) {
    // Ambil file dari form
    form, err := ctx.MultipartForm()
    if err != nil {
        ctx.JSON(http.StatusBadRequest, gin.H{
            "success": false,
            "message": "Invalid request",
        })
        return
    }

    files := form.File["files"]
    fileType := ctx.PostForm("type")
    if fileType == "" {
        fileType = "document"
    }

    uploadedFiles := []gin.H{}

    for _, file := range files {
        // Generate unique filename
        filename := fmt.Sprintf("%d_%s%s", 
            time.Now().Unix(), 
            generateRandomToken(8), 
            filepath.Ext(file.Filename))

        // Buat direktori jika belum ada
        uploadDir := fmt.Sprintf("storage/files/%s", fileType)
        os.MkdirAll(uploadDir, 0755)

        // Simpan file
        filePath := filepath.Join(uploadDir, filename)
        if err := ctx.SaveUploadedFile(file, filePath); err != nil {
            ctx.JSON(http.StatusInternalServerError, gin.H{
                "success": false,
                "message": "Failed to save file",
            })
            return
        }

        // Simpan ke database
        imageRecord := models.Image{
            Filename:     filename,
            OriginalName: file.Filename,
            Type:         fileType,
            Size:         file.Size,
            Path:         filePath,
        }
        c.db.Create(&imageRecord)

        uploadedFiles = append(uploadedFiles, gin.H{
            "id":            imageRecord.ID,
            "filename":      filename,
            "url":          fmt.Sprintf("/storage/files/%s/%s", fileType, filename),
            "type":         fileType,
            "original_name": file.Filename,
        })
    }

    ctx.JSON(http.StatusOK, gin.H{
        "success": true,
        "message": fmt.Sprintf("%d files uploaded successfully", len(uploadedFiles)),
        "data":   uploadedFiles,
    })
}

// DeleteImage function - setara dengan deleteImage()
func (c *MobileAuthController) DeleteImage(ctx *gin.Context) {
    id := ctx.Param("id")

    var image models.Image
    if err := c.db.First(&image, id).Error; err != nil {
        ctx.JSON(http.StatusNotFound, gin.H{
            "success": false,
            "message": "Image not found",
        })
        return
    }

    // Hapus file dari storage
    if err := os.Remove(image.Path); err != nil {
        ctx.JSON(http.StatusInternalServerError, gin.H{
            "success": false,
            "message": "Failed to delete file",
        })
        return
    }

    // Hapus dari database
    c.db.Delete(&image)

    ctx.JSON(http.StatusOK, gin.H{
        "success": true,
        "message": "Image deleted successfully",
    })
}

// Helper function untuk generate random token
func generateRandomToken(length int) string {
    bytes := make([]byte, length/2)
    rand.Read(bytes)
    return hex.EncodeToString(bytes)
} 