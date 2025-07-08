package middleware

import (
    "net/http"
    "strings"
    "time"
    "github.com/gin-gonic/gin"
    "portal-api/config"
)

func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(http.StatusUnauthorized, gin.H{
                "status":  "error",
                "message": "Authorization header required",
            })
            c.Abort()
            return
        }

        // Extract token from "Bearer <token>"
        tokenString := strings.Replace(authHeader, "Bearer ", "", 1)

        // Cek token di database
        var tokenData struct {
            ClientID uint `json:"client_id"`
        }
        
        db := config.GetDB()
        if err := db.Table("api_tokens").
            Select("client_id").
            Where("token = ? AND expires_at > ?", tokenString, time.Now()).
            First(&tokenData).Error; err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{
                "status":  "error",
                "message": "Token tidak valid atau sudah kadaluarsa",
            })
            c.Abort()
            return
        }

        // Set client info in context
        c.Set("client_id", tokenData.ClientID)

        c.Next()
    }
} 