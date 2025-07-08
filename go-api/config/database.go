package config

import (
    "fmt"
    "log"
    "gorm.io/driver/mysql"
    "gorm.io/gorm"
)

var db *gorm.DB

func InitDB() {
    // Gunakan database yang sama dengan Laravel
    // Sesuaikan dengan konfigurasi database Anda
    dsn := "root:@tcp(localhost:3306)/portal_db?charset=utf8mb4&parseTime=True&loc=Local"
    
    var err error
    db, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }
    
    fmt.Println("Database connected successfully")
}

func GetDB() *gorm.DB {
    return db
} 