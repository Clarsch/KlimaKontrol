package models

import "time"

type GatewayDB struct {
	GatewayID       string    `gorm:"primaryKey;size:50"`
	GatewayName     string    `gorm:"size:50;not null"`
	LastSeenUTC     time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	SoftwareVersion string    `gorm:"size:50"`
	Paired          string    `gorm:"size:5"`
}
