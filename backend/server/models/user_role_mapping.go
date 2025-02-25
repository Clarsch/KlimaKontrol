package models

import "time"

type UserRoleMapping struct {
	MappingID             int        `gorm:"primaryKey;autoIncrement"`
	UserID                int        `gorm:"index"`
	RoleID                int        `gorm:"index"`
	MappingCreatedTimeUTC time.Time  `gorm:"default:CURRENT_TIMESTAMP"`
	MappingArchived       *time.Time `gorm:"default:null"`
}
