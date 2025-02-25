package models

type Location struct {
	LocationID   int    `gorm:"primaryKey;autoIncrement"`
	LocationName string `gorm:"size:50;not null"`
	Settings     string `gorm:"size:255;not null"`
	Thresholds   string `gorm:"size:255;not null"`
}
