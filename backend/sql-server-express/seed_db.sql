
USE KlimaKontrolDB;
GO

-- Inserting into Roles table
INSERT INTO Roles (RoleName, Description) VALUES
('Admin', 'Administrator with full access.'),
('Manager', 'Manager with access to overviewv of multiple locations.'),
('User', 'Regular user with restricted access.');

-- Inserting into Areas table
INSERT INTO Areas (AreaName) VALUES
('Aabenraa Provsti'),
('Haderslev Domprovsti'),
('Tønder Provsti'),
('Sønderborg Provsti');

-- Inserting into Users table
INSERT INTO Users (Username, DisplayName, PasswordHash, Email, CreatedAtUTC) VALUES
('michael', 'Michael Schmidt', 'Password1', 'ms@km.dk', GETDATE()),
('christian', 'Christian Schmidt', 'Password1', 'csc@km.dk', GETDATE());

-- Inserting into Locations table
INSERT INTO Locations (LocationName, Settings, Thresholds) VALUES
('Sankt Nicolai Kirke', '{baseTemp: 15}', 'Threshold1'),
('Rise Kirke', '{baseTemp: 18}', 'Threshold2'),
('Haderslev Domkirke', '{baseTemp: 16}', 'Threshold2');

-- Inserting into Sensors table
INSERT INTO Sensors (SensorID, SensorName, SensorType, BatteryVoltage, RssiSignalStrength) VALUES
('16938384.41622496812705309768', 'Rise Alter', 'HTP.xw', 3.6, -50),
('16938386.41622496812705309228', 'Rise Dør', 'HTP.xw', 3.7, -60);

-- Inserting into Gateways table
INSERT INTO Gateways (GatewayID, GatewayName, LastSeenUTC, SoftwareVersion, Paired) VALUES
('jGYtlG1RX45fG+VzAcqakiptyeRWuhr4oqoSNtBSZ9k=', 'Rise Gateway', '2025-01-25T20:38:43.000Z', '1.2.0(37)', 'TRUE');

-- Inserting into Observations table (Assuming SensorID from Sensors table exists)
INSERT INTO Observations (ObservedTimeUTC, SensorID, TemperatureFahrenheit, Humidity, BarometricPressureInches, DewpointFahrenheit) VALUES
("2025-01-25T22:05:59.000Z", '16938384.41622496812705309768', 72.39, 44.95, 29.69, 49.78),
("2025-01-25T22:05:00.000Z", '16938384.41622496812705309768', 72.34, 44.91, 29.69, 49.72),
("2025-01-25T22:04:01.000Z", '16938384.41622496812705309768', 72.36, 44.87, 29.69, 49.72);


INSERT INTO UserRoleMapping (UserID, RoleID) VALUES
(1, 2),  -- michael as Manager
(1, 3),  -- michael as User
(2, 1),  -- christian as Admin
(2, 2),  -- christian as Manager
(2, 3);  -- christian as User

INSERT INTO UserAreaMapping (UserID, AreaID) VALUES
(1, 1),  -- michael with Sankt Nicolai
(1, 2),  -- michael with Rise
(2, 1),  -- christian with Sankt Nicolai
(2, 2);  -- christian with Rise

INSERT INTO AreaLocationMapping (LocationID, AreaID) VALUES
(1, 1),  -- Sankt Nicolai Kirke with Aabenraa Provsti
(2, 1),  -- Rise Kirke with Aabenraa Provsti
(3, 2);  -- Haderslev Domkirke with Haderslev Domprovsti


INSERT INTO GatewayLocationMapping (GatewayID, LocationID) VALUES
(1, 2); --GateWay to Rise Kirke

INSERT INTO SensorLocationMapping (SensorID, LocationID) VALUES
(1, 2); --Sensor1 to Rise Kirke
(2, 2); --Sensor2 to Rise Kirke



