package models

type Location struct {
	LocationID   int    `gorm:"primaryKey;autoIncrement"`
	LocationName string `gorm:"size:50;not null"`
	Settings     string `gorm:"size:255;not null"`
	Thresholds   string `gorm:"size:255;not null"`
}

type LocationSettings struct {
	GroundTemperature int
}

type LocationThresholds struct {
	Temperature Threshold
	Humidity    Threshold
	Pressure    Threshold
}
type Threshold struct {
	MinValue int
	MaxValue int
}
