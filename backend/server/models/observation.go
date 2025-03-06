package models

import "time"

type ObservationDB struct {
	ObservationID            int       `gorm:"primaryKey;autoIncrement"`
	ObservedTimeUTC          time.Time `gorm:"not null"`
	SensorID                 string    `gorm:"size:50;index"`
	TemperatureFahrenheit    float64   `gorm:"type:float"`
	Humidity                 float64   `gorm:"type:float"`
	BarometricPressureInches float64   `gorm:"type:float"`
	DewpointFahrenheit       float64   `gorm:"type:float"`
}
