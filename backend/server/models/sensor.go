package models

type SensorDB struct {
	SensorID           string  `gorm:"primaryKey;size:50"`
	SensorName         string  `gorm:"size:50;not null"`
	SensorType         string  `gorm:"size:50;not null"`
	BatteryVoltage     float64 `gorm:"type:float"`
	RssiSignalStrength int     `gorm:"type:int"`
}
