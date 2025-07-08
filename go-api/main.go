package main

import (
    "log"
    "github.com/gin-gonic/gin"
    "portal-api/config"
    "portal-api/routes"
)

func main() {
    // Initialize database (gunakan database yang sama dengan Laravel)
    config.InitDB()
    
    // Setup Gin router
    r := gin.Default()
    
    // Setup CORS untuk Laravel
    r.Use(func(c *gin.Context) {
        c.Header("Access-Control-Allow-Origin", "*")
        c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        
        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }
        
        c.Next()
    })
    
    // Setup routes dengan prefix /api/v2
    routes.SetupRoutes(r)
    
    // Start server di port 8081 (Laravel tetap di port 80/443)
    log.Println("Server starting on port 8081...")
    log.Fatal(r.Run(":8081"))
} 