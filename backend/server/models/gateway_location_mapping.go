package models

import "time"

type GatewayLocationMapping struct {
	MappingID             int        `gorm:"primaryKey;autoIncrement"`
	GatewayID             string     `gorm:"index"`
	LocationID            int        `gorm:"index"`
	MappingCreatedTimeUTC time.Time  `gorm:"default:CURRENT_TIMESTAMP"`
	MappingArchived       *time.Time `gorm:"default:null"`
}
