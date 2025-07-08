package models

import (
    "time"
    "gorm.io/gorm"
)

type Client struct {
    ID           uint           `json:"id" gorm:"primaryKey"`
    Firstname    string         `json:"firstname"`
    Lastname     string         `json:"lastname"`
    Email        string         `json:"email"`
    Password     string         `json:"-"` // "-" means don't include in JSON
    Phonenumber  string         `json:"phonenumber"`
    Address1     string         `json:"address1"`
    Address2     string         `json:"address2"`
    City         string         `json:"city"`
    State        string         `json:"state"`
    Postcode     string         `json:"postcode"`
    Country      string         `json:"country"`
    Companyname  string         `json:"companyname"`
    Status       string         `json:"status"`
    Datecreated  time.Time      `json:"datecreated"`
    CreatedAt    time.Time      `json:"created_at"`
    UpdatedAt    time.Time      `json:"updated_at"`
    DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

func (Client) TableName() string {
    return "tblclients"
} 