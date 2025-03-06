package models

import (
	"encoding/json"
	"fmt"
	"strings"
)

type LocationDB struct {
	LocationID   int    `gorm:"primaryKey;autoIncrement"`
	LocationName string `gorm:"size:50;not null"`
	Settings     string `gorm:"type:nvarchar(max)"`
	Thresholds   string `gorm:"type:nvarchar(max)"`
}

type Location struct {
	LocationID   int                `json:"location_id"`
	LocationName string             `json:"location_name"`
	Settings     LocationSettings   `json:"settings"`
	Thresholds   LocationThresholds `json:"thresholds"`
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

// Function to convert Location to LocationDB
func (l Location) ToDB() LocationDB {
	settingsJSON, _ := json.Marshal(l.Settings)
	thresholdsJSON, _ := json.Marshal(l.Thresholds)

	return LocationDB{
		LocationID:   l.LocationID,
		LocationName: l.LocationName,
		Settings:     string(settingsJSON),
		Thresholds:   string(thresholdsJSON),
	}
}

// Function to convert LocationDB to Location
func (locDB LocationDB) FromDB() Location {
	var settings LocationSettings
	var thresholds LocationThresholds

	json.Unmarshal([]byte(locDB.Settings), &settings)
	json.Unmarshal([]byte(locDB.Thresholds), &thresholds)

	return Location{
		LocationID:   locDB.LocationID,
		LocationName: locDB.LocationName,
		Settings:     settings,
		Thresholds:   thresholds,
	}
}

// Function to convert a slice of Location to a slice of LocationDB
func ConvertLocationsToDB(locations []Location) []LocationDB {
	var locationDBs []LocationDB
	for _, loc := range locations {
		locationDB := loc.ToDB() // Convert each Location to LocationDB
		locationDBs = append(locationDBs, locationDB)
	}
	return locationDBs
}

// Function to convert a slice of Location to a slice of LocationDB
func ConvertToLocationsFromDB(locationDBs []LocationDB) []Location {
	var locations []Location
	for _, loc := range locationDBs {
		location := loc.FromDB() // Convert each Location to LocationDB
		locations = append(locations, location)
	}
	return locations
}

func (l Location) PrettyPrint() {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("Location ID: %d\n", l.LocationID))
	sb.WriteString(fmt.Sprintf("Location Name: %s\n", l.LocationName))
	sb.WriteString(fmt.Sprintf("Settings:\n"))
	sb.WriteString(fmt.Sprintf("  - Ground Temperature: %d°C\n", l.Settings.GroundTemperature))
	sb.WriteString(fmt.Sprintf("Thresholds:\n"))
	sb.WriteString(fmt.Sprintf("  - Temperature: Min %d°C, Max %d°C\n", l.Thresholds.Temperature.MinValue, l.Thresholds.Temperature.MaxValue))
	sb.WriteString(fmt.Sprintf("  - Humidity: Min %d%%, Max %d%%\n", l.Thresholds.Humidity.MinValue, l.Thresholds.Humidity.MaxValue))
	sb.WriteString(fmt.Sprintf("  - Pressure: Min %d hPa, Max %d hPa\n", l.Thresholds.Pressure.MinValue, l.Thresholds.Pressure.MaxValue))

	fmt.Println(sb.String())
}
