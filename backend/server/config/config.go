package config

import (
	"fmt"
	"os"
	"time"

	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
)

func ConnectDB() (*gorm.DB, error) {
	// Get the DATABASE_URL environment variable
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		panic("DATABASE_URL environment variable is not set")
	}

	// Attempt to connect to the database with retries
	var db *gorm.DB
	var err error

	for i := 0; i < 15; i++ {
		// Open the database connection
		db, err = gorm.Open(sqlserver.Open(dsn), &gorm.Config{})
		if err != nil {
			fmt.Printf("Attempt %d: Failed to connect to database: %v\n", i+1, err)
			time.Sleep(2 * time.Second) // Wait before retrying
			continue
		}

		fmt.Println("Successfully connected to the database.")
	}

	// Final error message if all attempts fail
	if err != nil {
		panic(fmt.Sprintf("failed to connect to database after multiple attempts: %v", err))
	}

	// When Connected
	// Check if the database exists
	dbExists := false
	_ = db.Raw("SELECT db_id('KlimaKontrolDB')").Scan(&dbExists).Error
	/*if err != nil {
		return nil, fmt.Errorf("error checking database existence: %v", err)
	}*/

	if dbExists == false {
		// Create the database if it doesn't exist
		if err := db.Exec("CREATE DATABASE KlimaKontrolDB").Error; err != nil {
			return nil, fmt.Errorf("failed to create database: %v", err)
		}
		fmt.Println("Database KlimaKontrolDB created.")
	} else {
		fmt.Println("Database KlimaKontrolDB already exists.")
	}

	// Optionally, you can switch to the new database
	db = db.Exec("USE KlimaKontrolDB")

	return db, nil
}
