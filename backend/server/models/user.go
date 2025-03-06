package models

import "time"

type UserDB struct {
	UserID       int       `gorm:"primaryKey;autoIncrement"`
	Username     string    `gorm:"size:50;not null;unique"`
	DisplayName  string    `gorm:"size:50;not null"`
	PasswordHash string    `gorm:"size:255;not null"`
	Email        string    `gorm:"size:100;not null;unique"`
	CreatedAtUTC time.Time `gorm:"default:CURRENT_TIMESTAMP"`
}
