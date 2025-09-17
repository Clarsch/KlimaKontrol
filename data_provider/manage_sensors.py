#!/usr/bin/env python3
"""
Sensor management utility for the Data Provider Service.
"""

import sys
import argparse
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent / "src"))

from config.config_loader import load_config
from database.connection import initialize_database
from src.database_manager import DatabaseManager
from src.logger import initialize_logger, get_logger

logger = get_logger(__name__)


def list_sensors(db_manager: DatabaseManager):
    """List all sensors."""
    print("\n=== All Sensors ===")
    with db_manager.get_session() as session:
        from database.models import get_active_sensors
        sensors = get_active_sensors(session)
        
        if not sensors:
            print("No sensors found.")
            return
        
        print(f"{'ID':<4} {'SensorPush ID':<25} {'Local ID':<20} {'Location':<15} {'Name':<20} {'Type':<10} {'Status':<12}")
        print("-" * 115)
        
        for sensor in sensors:
            status = "UNASSIGNED" if sensor.local_sensor_id is None or sensor.location_id is None else "ASSIGNED"
            local_id = sensor.local_sensor_id or "NULL"
            location = sensor.location_id or "NULL"
            print(f"{sensor.id:<4} {sensor.sensorpush_id:<25} {local_id:<20} {location:<15} {sensor.sensor_name or 'N/A':<20} {sensor.device_type or 'N/A':<10} {status:<12}")


def list_unassigned_sensors(db_manager: DatabaseManager):
    """List unassigned sensors."""
    sensors = db_manager.get_unassigned_sensors()
    
    if not sensors:
        print("No unassigned sensors found.")
        return
    
    print("\n=== Unassigned Sensors ===")
    print(f"{'ID':<4} {'SensorPush ID':<25} {'Name':<20} {'Type':<10} {'Missing':<15}")
    print("-" * 80)
    
    for sensor in sensors:
        missing = []
        if sensor['local_sensor_id'] is None:
            missing.append("local_id")
        if sensor['location_id'] is None:
            missing.append("location")
        missing_str = ", ".join(missing)
        
        print(f"{sensor['id']:<4} {sensor['sensorpush_id']:<25} {sensor['sensor_name'] or 'N/A':<20} {sensor['device_type'] or 'N/A':<10} {missing_str:<15}")


def list_sensors_by_location(db_manager: DatabaseManager, location_id: str):
    """List sensors for a specific location."""
    sensors = db_manager.get_sensor_by_location(location_id)
    
    if not sensors:
        print(f"No sensors found for location: {location_id}")
        return
    
    print(f"\n=== Sensors for Location: {location_id} ===")
    print(f"{'ID':<4} {'SensorPush ID':<25} {'Local ID':<20} {'Name':<20} {'Type':<10}")
    print("-" * 85)
    
    for sensor in sensors:
        print(f"{sensor['id']:<4} {sensor['sensorpush_id']:<25} {sensor['local_sensor_id']:<20} {sensor['sensor_name'] or 'N/A':<20} {sensor['device_type'] or 'N/A':<10}")


def assign_sensor(db_manager: DatabaseManager, sensorpush_id: str, local_sensor_id: str, location_id: str):
    """Assign sensor with local ID and location."""
    success = db_manager.assign_sensor(sensorpush_id, local_sensor_id, location_id)
    if success:
        print(f"Successfully assigned sensor {sensorpush_id} -> {local_sensor_id} at {location_id}")
    else:
        print(f"Failed to assign sensor {sensorpush_id}")


def update_sensor_location(db_manager: DatabaseManager, sensorpush_id: str, new_location: str):
    """Update sensor location."""
    success = db_manager.update_sensor_location(sensorpush_id, new_location)
    if success:
        print(f"Successfully updated sensor {sensorpush_id} to location {new_location}")
    else:
        print(f"Failed to update sensor {sensorpush_id}")


def sync_sensors_from_api(db_manager: DatabaseManager, config):
    """Sync sensors from SensorPush API."""
    print("Syncing sensors from SensorPush API...")
    
    try:
        from src.sensorpush_client import SensorPushClient
        
        client = SensorPushClient(
            api_url=config.sensorpush.api_url,
            email=config.sensorpush.credentials.email,
            password=config.sensorpush.credentials.password
        )
        
        # Test connection
        if not client.test_connection():
            print("Failed to connect to SensorPush API")
            return
        
        # Get sensors
        sensors_data = client.get_sensors()
        sensor_created, sensor_updated = db_manager.sync_sensors(
            sensors_data.get('sensors', {}),
            config.sensors.default_location
        )
        
        print(f"Sync completed: {sensor_created} created, {sensor_updated} updated")
        
        client.close()
        
    except Exception as e:
        print(f"Failed to sync sensors: {e}")


def main():
    parser = argparse.ArgumentParser(description="Sensor Management Utility")
    parser.add_argument("--config", default="config/config.json", help="Configuration file path")
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # List all sensors
    subparsers.add_parser("list", help="List all sensors")
    
    # List unassigned sensors
    subparsers.add_parser("list-unassigned", help="List unassigned sensors")
    
    # List sensors by location
    list_location_parser = subparsers.add_parser("list-location", help="List sensors for a location")
    list_location_parser.add_argument("location_id", help="Location ID")
    
    # Assign sensor
    assign_parser = subparsers.add_parser("assign", help="Assign sensor with local ID and location")
    assign_parser.add_argument("sensorpush_id", help="SensorPush ID")
    assign_parser.add_argument("local_sensor_id", help="Local sensor ID")
    assign_parser.add_argument("location_id", help="Location ID")
    
    # Update sensor location
    update_parser = subparsers.add_parser("update-location", help="Update sensor location")
    update_parser.add_argument("sensorpush_id", help="SensorPush ID")
    update_parser.add_argument("new_location", help="New location ID")
    
    # Sync from API
    subparsers.add_parser("sync", help="Sync sensors from SensorPush API")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Initialize
    try:
        config = load_config(args.config)
        initialize_logger(log_level="INFO", console_output=True)
        initialize_database(config.database.path)
        db_manager = DatabaseManager()
        
        # Execute command
        if args.command == "list":
            list_sensors(db_manager)
        elif args.command == "list-unassigned":
            list_unassigned_sensors(db_manager)
        elif args.command == "list-location":
            list_sensors_by_location(db_manager, args.location_id)
        elif args.command == "assign":
            assign_sensor(db_manager, args.sensorpush_id, args.local_sensor_id, args.location_id)
        elif args.command == "update-location":
            update_sensor_location(db_manager, args.sensorpush_id, args.new_location)
        elif args.command == "sync":
            sync_sensors_from_api(db_manager, config)
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
