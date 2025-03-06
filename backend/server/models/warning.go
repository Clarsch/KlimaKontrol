package models

import "time"

type WarningDB struct {
	WarningID      int       `gorm:"primaryKey;autoIncrement"`
	Type           string    `gorm:"size:50;not null"`
	WarningTimeUTC time.Time `gorm:"not null"`
	Value          float32
	Threshold      float32
	DeactivatedAt  time.Time
	DeactivatedBy  string `gorm:"size:255;not null;"`
}
