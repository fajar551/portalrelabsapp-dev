package models

import (
    "time"
    "gorm.io/gorm"
)

type Image struct {
    ID           uint           `json:"id" gorm:"primaryKey"`
    Filename     string         `json:"filename"`
    OriginalName string         `json:"original_name"`
    Type         string         `json:"type"`
    Size         int64          `json:"size"`
    Path         string         `json:"path"`
    CreatedAt    time.Time      `json:"created_at"`
    UpdatedAt    time.Time      `json:"updated_at"`
    DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

func (Image) TableName() string {
    return "images"
} 