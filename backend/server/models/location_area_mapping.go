package models

import "time"

type LocationAreaMapping struct {
	MappingID             int        `gorm:"primaryKey;autoIncrement"`
	LocationID            int        `gorm:"index"`
	AreaID                int        `gorm:"index"`
	MappingCreatedTimeUTC time.Time  `gorm:"default:CURRENT_TIMESTAMP"`
	MappingArchived       *time.Time `gorm:"default:null"`
}
