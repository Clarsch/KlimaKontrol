package models

type Area struct {
	AreaID   int    `gorm:"primaryKey;autoIncrement"`
	AreaName string `gorm:"size:50;not null;unique"`
}
