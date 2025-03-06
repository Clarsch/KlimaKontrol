package config

import (
	"klimakontrol/models"
	"time"

	"gorm.io/gorm"
)

func SeedData(db *gorm.DB) {
	// Seed Roles
	roles := []models.RoleDB{
		{RoleName: "Admin", Description: "Administrator with full access."},
		{RoleName: "Manager", Description: "Manager with access to overviewv of multiple locations."},
		{RoleName: "User", Description: "Regular user with restricted access."},
	}
	db.Create(&roles)

	// Seed Areas

	areas := []models.AreaDB{
		{AreaName: "Aabenraa Provsti"},
		{AreaName: "Haderslev Domprovsti"},
		{AreaName: "Tønder Provsti"},
		{AreaName: "Sønderborg Provsti"},
	}
	db.Create(&areas)

	// Seed Users
	users := []models.UserDB{
		{Username: "michael", DisplayName: "Michael Schmidt", PasswordHash: "Password1", Email: "ms@km.dk", CreatedAtUTC: time.Now()},
		{Username: "christian", DisplayName: "Christian Schmidt", PasswordHash: "Password1", Email: "csc@km.dk", CreatedAtUTC: time.Now()},
	}
	db.Create(&users)

	// Seed Locations
	locations := []models.Location{
		{LocationName: "Sankt Nicolai Kirke",
			Settings: models.LocationSettings{GroundTemperature: 15},
			Thresholds: models.LocationThresholds{
				Temperature: models.Threshold{MinValue: 8, MaxValue: 22},
				Humidity:    models.Threshold{MinValue: 40, MaxValue: 65},
				Pressure:    models.Threshold{MinValue: 950, MaxValue: 1040},
			}},
		{LocationName: "Rise Kirke",
			Settings: models.LocationSettings{GroundTemperature: 14},
			Thresholds: models.LocationThresholds{
				Temperature: models.Threshold{MinValue: 8, MaxValue: 22},
				Humidity:    models.Threshold{MinValue: 40, MaxValue: 65},
				Pressure:    models.Threshold{MinValue: 950, MaxValue: 1040},
			}},
		{LocationName: "Haderslev Domkirke",
			Settings: models.LocationSettings{GroundTemperature: 16},
			Thresholds: models.LocationThresholds{
				Temperature: models.Threshold{MinValue: 8, MaxValue: 22},
				Humidity:    models.Threshold{MinValue: 40, MaxValue: 65},
				Pressure:    models.Threshold{MinValue: 950, MaxValue: 1040},
			}},
	}
	locationDBs := models.ConvertLocationsToDB(locations)

	db.Create(&locationDBs)

	// Seed Sensors
	sensors := []models.SensorDB{
		{SensorID: "16938384.41622496812705309768", SensorName: "Rise Alter", SensorType: "HTP.xw", BatteryVoltage: 3.6, RssiSignalStrength: -50},
		{SensorID: "16938386.41622496812705309228", SensorName: "Rise Dør", SensorType: "HTP.xw", BatteryVoltage: 3.7, RssiSignalStrength: -60},
	}
	db.Create(&sensors)

	// Seed Gateways
	gateways := []models.GatewayDB{
		{GatewayID: "jGYtlG1RX45fG+VzAcqakiptyeRWuhr4oqoSNtBSZ9k=", GatewayName: "Rise Gateway", LastSeenUTC: time.Date(2025, 1, 25, 20, 38, 43, 0, time.UTC), SoftwareVersion: "1.2.0(37)", Paired: "true"},
	}
	db.Create(&gateways)

	// Seed Observations
	observations := []models.ObservationDB{
		{ObservedTimeUTC: time.Date(2025, 1, 25, 22, 5, 59, 0, time.UTC), SensorID: "16938384.41622496812705309768", TemperatureFahrenheit: 72.39, Humidity: 44.95, BarometricPressureInches: 29.69, DewpointFahrenheit: 49.78},
		{ObservedTimeUTC: time.Date(2025, 1, 25, 22, 5, 0, 0, time.UTC), SensorID: "16938384.41622496812705309768", TemperatureFahrenheit: 72.34, Humidity: 44.91, BarometricPressureInches: 29.69, DewpointFahrenheit: 49.72},
		{ObservedTimeUTC: time.Date(2025, 1, 25, 22, 4, 1, 0, time.UTC), SensorID: "16938384.41622496812705309768", TemperatureFahrenheit: 72.36, Humidity: 44.87, BarometricPressureInches: 29.69, DewpointFahrenheit: 49.72},
	}
	db.Create(&observations)

	// Seed UserRoleMapping
	userRoleMappings := []models.UserRoleMappingDB{
		{UserID: 1, RoleID: 2}, // michael as Manager
		{UserID: 1, RoleID: 3}, // michael as User
		{UserID: 2, RoleID: 1}, // christian as Admin
		{UserID: 2, RoleID: 2}, // christian as Manager
		{UserID: 2, RoleID: 3}, // christian as User
	}
	db.Create(&userRoleMappings)

	// Seed UserAreaMapping
	userAreaMappings := []models.UserAreaMappingDB{
		{UserID: 1, AreaID: 1}, // michael with Sankt Nicolai
		{UserID: 1, AreaID: 2}, // michael with Rise
		{UserID: 2, AreaID: 1}, // christian with Sankt Nicolai
		{UserID: 2, AreaID: 2}, // christian with Rise
	}
	db.Create(&userAreaMappings)

	// Seed AreaLocationMapping
	areaLocationMappings := []models.LocationAreaMappingDB{
		{LocationID: 1, AreaID: 1}, // Sankt Nicolai Kirke with Aabenraa Provsti
		{LocationID: 2, AreaID: 1}, // Rise Kirke with Aabenraa Provsti
		{LocationID: 3, AreaID: 2}, // Haderslev Domkirke with Haderslev Domprovsti
	}
	db.Create(&areaLocationMappings)

	// Seed GatewayLocationMapping
	gatewayLocationMappings := []models.GatewayLocationMappingDB{
		{GatewayID: "jGYtlG1RX45fG+VzAcqakiptyeRWuhr4oqoSNtBSZ9k=", LocationID: 2}, // GateWay to Rise Kirke
	}
	db.Create(&gatewayLocationMappings)

	// Seed SensorLocationMapping
	sensorLocationMappings := []models.SensorLocationMappingDB{
		{SensorID: "16938384.41622496812705309768", LocationID: 2}, // Sensor1 to Rise Kirke
		{SensorID: "16938386.41622496812705309228", LocationID: 2}, // Sensor2 to Rise Kirke
	}
	db.Create(&sensorLocationMappings)
}
