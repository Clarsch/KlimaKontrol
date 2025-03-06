package config

import (
	"fmt"
	"klimakontrol/models"
	"os"
	"time"

	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
)

func ConnectDB() (*gorm.DB, error) {
	// Get the DATABASE environment variable
	dbServerConnectionString := getEnvVariable("DATABASE_SERVER_URL")

	// Attempt to connect to the database with retries
	db := tryConnectionToDatabase(dbServerConnectionString, "master")

	// When Connected -> Check if the KlimaKontrolDB already exists
	var dbExists int
	err := db.Raw("SELECT COUNT(*) FROM sys.databases WHERE name = ?", "KlimaKontrolDB").Scan(&dbExists).Error
	if err != nil {
		return nil, fmt.Errorf("error checking database existence: %v", err)
	}
	if dbExists == 0 {
		// Create the database if it doesn't exist
		if err := db.Exec("CREATE DATABASE KlimaKontrolDB").Error; err != nil {
			return nil, fmt.Errorf("failed to create database: %v", err)
		}
		fmt.Println("Database KlimaKontrolDB created.")
	}

	//Switching to klimakontrol database
	db = tryConnectionToDatabase(dbServerConnectionString, "KlimaKontrolDB")

	// If the database did not exist and is newly created, create also the tables and seed the database
	if dbExists == 0 { //TODO Should be changed to check if tables exists
		db.AutoMigrate(
			&models.RoleDB{},
			&models.AreaDB{},
			&models.UserDB{},
			&models.LocationDB{},
			&models.SensorDB{},
			&models.GatewayDB{},
			&models.ObservationDB{},
			&models.WarningDB{},
			&models.UserRoleMappingDB{},
			&models.UserAreaMappingDB{},
			&models.LocationAreaMappingDB{},
			&models.GatewayLocationMappingDB{},
			&models.SensorLocationMappingDB{},
		)

		fmt.Println("Database KlimaKontrolDB tables created.")

		// Seed data
		//SeedData(db)
		fmt.Println("Database KlimaKontrolDB seeded with startup data.")

	} else {
		fmt.Println("Database KlimaKontrolDB already exists.")
	}

	return db, nil
}

func getEnvVariable(envVariableName string) string {
	envValue := os.Getenv(envVariableName)
	if envValue == "" {
		panic(fmt.Sprintf(" %v environment variable is not set", envVariableName))
	}
	return envValue
}

func tryConnectionToDatabase(dbServerConnectionString string, databaseName string) *gorm.DB {

	var db *gorm.DB
	var err error

	for i := range 15 {
		// Open the database connection
		db, err = gorm.Open(sqlserver.Open(dbServerConnectionString+"?database="+databaseName+"&encrypt=true&trustServerCertificate=true"), &gorm.Config{})
		if err != nil {
			fmt.Printf("Attempt %d: Failed to connect to database: %v\n", i+1, err)
			time.Sleep(2 * time.Second) // Wait before retrying
			continue
		} else {
			fmt.Println("Successfully connected to the database.")
			break
		}

	}

	// Final error message if all attempts fail
	if err != nil {
		panic(fmt.Sprintf("failed to connect to database after multiple attempts: %v", err))
	}

	return db
}
