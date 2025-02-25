-- Use the master database to create a new database
USE master;
GO

-- Create the new database
CREATE DATABASE KlimaKontrolDB;
GO

-- Switch to the new database
USE KlimaKontrolDB;
GO


-- Create the Roles table
CREATE TABLE Roles (
    RoleID INT PRIMARY KEY IDENTITY(1,1),
    RoleName VARCHAR(50) NOT NULL UNIQUE,
    Description VARCHAR(255)
);
GO

-- Create the Users table
CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    Username VARCHAR(50) NOT NULL UNIQUE,
    DisplayName VARCHAR(50) NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    CreatedAtUTC DATETIME DEFAULT GETDATE()
);
GO

-- Create the Areas table
CREATE TABLE Areas (
    AreaID INT PRIMARY KEY IDENTITY(1,1),
    AreaName VARCHAR(50) NOT NULL UNIQUE
);
GO

-- Create the Locations table
CREATE TABLE Locations (
    LocationID INT PRIMARY KEY IDENTITY(1,1),
    LocationName VARCHAR(50) NOT NULL,
    Settings VARCHAR(255) NOT NULL,
    Thresholds VARCHAR(255) NOT NULL
);
GO

-- Create the Sensors table
CREATE TABLE Sensors (
    SensorID VARCHAR(50) PRIMARY KEY,
    SensorName VARCHAR(50) NOT NULL,
    SensorType VARCHAR(50) NOT NULL,
    BatteryVoltage FLOAT,
    RssiSignalStrength INT
);
GO

-- Create the Gateways table
CREATE TABLE Gateways (
    GatewayID VARCHAR(50) PRIMARY KEY,
    GatewayName VARCHAR(50) NOT NULL,
    LastSeenUTC DATETIME,
    SoftwareVersion VARCHAR(50),
    Paired VARCHAR(5) 
);
GO

-- Create the Observertaions table
CREATE TABLE Observations (
    ObservationID INT PRIMARY KEY IDENTITY(1,1),
    ObservedTimeUTC DATETIME NOT NULL,
    SensorID VARCHAR(50),
	TemperatureFahrenheit FLOAT,
    Humidity FLOAT,
    BarometricPressureInches FLOAT,
    DewpointFahrenheit FLOAT,
    FOREIGN KEY (SensorID) REFERENCES Sensors(SensorID)
);
GO

CREATE INDEX idx_observationSensor
ON Observations (SensorID);

CREATE INDEX idx_observationTime
ON Observations (ObservedTimeUTC);

-- Create the UserRoleMapping table
CREATE TABLE UserRoleMapping(
    MappingID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT, 
	RoleID INT,
	MappingCreatedTimeUTC  DATETIME DEFAULT GETDATE(),
    MappingArchived DATETIME DEFAULT NULL,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
);
GO

-- Create the UserAreaMapping table 
CREATE TABLE UserAreaMapping(
    MappingID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT, 
	AreaID INT,
	MappingCreatedTimeUTC  DATETIME DEFAULT GETDATE(),
    MappingArchived DATETIME DEFAULT NULL,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (AreaID) REFERENCES Areas(AreaID)
);
GO

-- Create the AreaLocationMapping table
CREATE TABLE LocationAreaMapping(
    MappingID INT PRIMARY KEY IDENTITY(1,1),
    LocationID INT, 
	AreaID INT,
	MappingCreatedTimeUTC DATETIME DEFAULT GETDATE(),
    MappingArchived DATETIME DEFAULT NULL,
    FOREIGN KEY (LocationID) REFERENCES Locations(LocationID),
    FOREIGN KEY (AreaID) REFERENCES Areas(AreaID)
);
GO

-- Create the GatewayMapping table
CREATE TABLE GatewayLocationMapping(
    MappingID INT PRIMARY KEY IDENTITY(1,1),
	GatewayID  VARCHAR(50),
    LocationId INT, 
	MappingCreatedTimeUTC DATETIME DEFAULT GETDATE(),
    MappingArchived DATETIME DEFAULT NULL,
    FOREIGN KEY (LocationID) REFERENCES Locations(LocationID),
    FOREIGN KEY (GatewayID) REFERENCES Gateways(GatewayID)
);
GO

-- Create the SensorMapping table
CREATE TABLE SensorLocationMapping(
    MappingID INT PRIMARY KEY IDENTITY(1,1),
	SensorID  VARCHAR(50),
    LocationID INT, 
	MappingCreatedTimeUTC DATETIME DEFAULT GETDATE(),
    MappingArchived DATETIME DEFAULT NULL,
    FOREIGN KEY (LocationID) REFERENCES Locations(LocationID),
    FOREIGN KEY (SensorID) REFERENCES Sensors(SensorID)
);
GO



