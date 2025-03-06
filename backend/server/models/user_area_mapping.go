package models

import "time"

type UserAreaMappingDB struct {
	MappingID             int        `gorm:"primaryKey;autoIncrement"`
	UserID                int        `gorm:"index"`
	AreaID                int        `gorm:"index"`
	MappingCreatedTimeUTC time.Time  `gorm:"default:CURRENT_TIMESTAMP"`
	MappingArchived       *time.Time `gorm:"default:null"`
}
