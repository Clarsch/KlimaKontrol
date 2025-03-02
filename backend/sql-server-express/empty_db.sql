USE KlimaKontrolDB;
GO

DELETE FROM UserAreaMapping
DELETE FROM SensorLocationMapping
DELETE FROM LocationAreaMapping
DELETE FROM UserRoleMapping
DELETE FROM GatewayLocationMapping

DELETE FROM Users
DELETE FROM Roles
DELETE FROM Areas
DELETE FROM Locations
DELETE FROM Observations
DELETE FROM Sensors
DELETE FROM Gateways
