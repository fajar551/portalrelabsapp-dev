package routes

import (
    "github.com/gin-gonic/gin"
    "portal-api/controllers"
    "portal-api/middleware"
)

func SetupRoutes(r *gin.Engine) {
    // API v2 routes (Go) - prefix /api/v2
    v2 := r.Group("/api/v2")
    {
        // Auth routes (no middleware)
        auth := v2.Group("/auth")
        {
            mobileAuth := controllers.NewMobileAuthController()
            auth.POST("/login", mobileAuth.Login)
        }

        // Protected routes (with middleware)
        protected := v2.Group("/")
        protected.Use(middleware.AuthMiddleware())
        {
            mobileAuth := controllers.NewMobileAuthController()
            
            // Client routes
            protected.GET("/clients", mobileAuth.GetAllClients)
            protected.GET("/client", mobileAuth.GetClientById)
            protected.GET("/client/:id", mobileAuth.GetClientById)
            
            // Invoice routes
            protected.GET("/invoices", mobileAuth.GetAllInvoices)
            
            // File upload routes
            protected.POST("/upload-files", mobileAuth.UploadFiles)
            protected.DELETE("/delete-image/:id", mobileAuth.DeleteImage)
        }
    }
} 