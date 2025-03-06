package models

import "time"

type SensorLocationMappingDB struct {
	MappingID             int        `gorm:"primaryKey;autoIncrement"`
	SensorID              string     `gorm:"index"`
	LocationID            int        `gorm:"index"`
	MappingCreatedTimeUTC time.Time  `gorm:"default:CURRENT_TIMESTAMP"`
	MappingArchived       *time.Time `gorm:"default:null"`
}
