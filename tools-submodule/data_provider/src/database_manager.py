"""
Database operations manager for the data provider service.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
import logging

from database.connection import get_session
from database.models import (
    Sensor, Gateway, SensorState, SensorReading, UploadLog, ServiceState,
    get_sensor_by_sensorpush_id, get_sensor_by_local_id, get_active_sensors,
    get_sensor_state, get_unuploaded_readings, get_readings_by_sensor_and_time,
    get_old_readings
)

from .logger import get_logger

logger = get_logger(__name__)


def adjust_time_for_denmark(dt_string):
    """
    Adjust time string for Denmark timezone (+2 hours).
    
    Args:
        dt_string: Time string in format 'YYYY-MM-DD HH:MM:SS'
        
    Returns:
        Adjusted time string or original if parsing fails
    """
    if not dt_string:
        return dt_string
    
    try:
        # Parse the datetime string
        dt = datetime.strptime(dt_string, '%Y-%m-%d %H:%M:%S')
        # Add 2 hours for Denmark timezone
        adjusted_dt = dt + timedelta(hours=2)
        # Return formatted string
        return adjusted_dt.strftime('%Y-%m-%d %H:%M:%S')
    except (ValueError, TypeError):
        # Return original string if parsing fails
        return dt_string


class DatabaseManager:
    """Manages database operations for the data provider service."""
    
    def __init__(self):
        """Initialize database manager."""
        logger.info("Database manager initialized")
    
    def sync_sensors(self, sensorpush_sensors: Dict[str, Any], sensorpush_gateways: Dict[str, Any] = None, default_location: str = "bov") -> Tuple[int, int]:
        """
        Sync sensors from SensorPush API with local database.
        
        Args:
            sensorpush_sensors: Sensors data from SensorPush API
            sensorpush_gateways: Gateways data from SensorPush API (for last_alert mapping)
            default_location: Default location for new sensors
            
        Returns:
            Tuple of (created_count, updated_count)
        """
        created_count = 0
        updated_count = 0
        
        logger.debug(f"Syncing {len(sensorpush_sensors)} sensors from SensorPush API")
        logger.debug(f"Sensor data: {sensorpush_sensors}")
        
        with get_session() as session:
            try:
                for sensorpush_id, sensor_data in sensorpush_sensors.items():
                    logger.debug(f"Processing sensor: {sensorpush_id} with data: {sensor_data}")
                    # Check if sensor exists
                    existing_sensor = get_sensor_by_sensorpush_id(session, sensorpush_id)
                    
                    # For new sensors, set local_sensor_id and location_id to None
                    # These must be manually assigned to avoid false data
                    local_sensor_id = sensor_data.get('deviceId')  # Only use if provided by API
                    if not local_sensor_id or local_sensor_id == sensorpush_id:
                        local_sensor_id = None  # Must be manually assigned
                    
                    # Find the corresponding gateway's last_alert for this sensor
                    last_seen_dt = None
                    if sensorpush_gateways:
                        sensor_name = sensor_data.get('name', '')
                        # Extract gateway identifier from sensor name (e.g., "001" from "001-2 Ensted Orgel")
                        gateway_id = None
                        if sensor_name and '-' in sensor_name:
                            gateway_prefix = sensor_name.split('-')[0].strip()
                            # Find matching gateway by name prefix
                            for gateway_key, gateway_data in sensorpush_gateways.items():
                                gateway_name = gateway_data.get('name', '')
                                if gateway_name and gateway_prefix in gateway_name:
                                    gateway_id = gateway_key
                                    break
                        
                        if gateway_id:
                            last_alert_str = sensorpush_gateways[gateway_id].get('last_alert')
                            if last_alert_str and last_alert_str != '1970-01-01T00:00:00.000Z':
                                try:
                                    # Parse ISO format timestamp
                                    last_seen_dt = datetime.fromisoformat(last_alert_str.replace('Z', '+00:00'))
                                    logger.debug(f"Mapped sensor {sensorpush_id} to gateway {gateway_id} with last_alert: {last_alert_str}")
                                except (ValueError, TypeError):
                                    logger.warning(f"Failed to parse last_alert timestamp for sensor {sensorpush_id} from gateway {gateway_id}: {last_alert_str}")
                        else:
                            logger.debug(f"Could not find matching gateway for sensor {sensorpush_id} with name: {sensor_name}")
                    
                    sensor_info = {
                        'sensorpush_id': sensorpush_id,
                        'local_sensor_id': local_sensor_id,  # None for new sensors
                        'location_id': None,  # Must be manually assigned
                        'sensor_name': sensor_data.get('name', ''),
                        'device_type': sensor_data.get('type', ''),
                        'mac_address': sensor_data.get('address', ''),
                        'is_active': sensor_data.get('active', True),
                        'battery_voltage': sensor_data.get('battery_voltage'),
                        'rssi': sensor_data.get('rssi'),
                        'last_seen': last_seen_dt,
                        'updated_at': datetime.utcnow()
                    }
                    
                    if existing_sensor:
                        # Update existing sensor (but preserve existing local_sensor_id and location_id)
                        for key, value in sensor_info.items():
                            if key not in ['sensorpush_id', 'local_sensor_id', 'location_id']:  # Don't update IDs or location
                                setattr(existing_sensor, key, value)
                        updated_count += 1
                        logger.debug(f"Updated sensor: {sensorpush_id}")
                    else:
                        # Create new sensor (with null local_sensor_id and location_id)
                        new_sensor = Sensor(**sensor_info)
                        session.add(new_sensor)
                        session.flush()  # Flush to get the ID
                        created_count += 1
                        logger.debug(f"Created sensor: {sensorpush_id} (unassigned - requires manual assignment)")
                        
                        # Create sensor state
                        sensor_state = SensorState(
                            sensor_id=new_sensor.id,
                            last_fetch_timestamp=datetime.utcnow() - timedelta(days=1)  # Start from yesterday
                        )
                        session.add(sensor_state)
                
                session.commit()
                logger.info(f"Sensor sync completed: {created_count} created, {updated_count} updated")
                
            except Exception as e:
                session.rollback()
                logger.error(f"Failed to sync sensors: {e}")
                raise
        
        return created_count, updated_count
    
    def assign_sensor(self, sensorpush_id: str, local_sensor_id: str, location_id: str) -> bool:
        """
        Assign local sensor ID and location to a sensor.
        
        Args:
            sensorpush_id: SensorPush ID of the sensor
            local_sensor_id: Local sensor ID to assign
            location_id: Location ID to assign
            
        Returns:
            True if assigned successfully, False otherwise
        """
        with get_session() as session:
            try:
                sensor = get_sensor_by_sensorpush_id(session, sensorpush_id)
                if sensor:
                    sensor.local_sensor_id = local_sensor_id
                    sensor.location_id = location_id
                    sensor.updated_at = datetime.utcnow()
                    session.commit()
                    logger.info(f"Assigned sensor {sensorpush_id} -> {local_sensor_id} at {location_id}")
                    return True
                else:
                    logger.warning(f"Sensor not found: {sensorpush_id}")
                    return False
            except Exception as e:
                session.rollback()
                logger.error(f"Failed to assign sensor: {e}")
                return False
    
    def update_sensor_location(self, sensorpush_id: str, new_location_id: str) -> bool:
        """
        Update sensor location.
        
        Args:
            sensorpush_id: SensorPush ID of the sensor
            new_location_id: New location ID
            
        Returns:
            True if updated successfully, False otherwise
        """
        with get_session() as session:
            try:
                sensor = get_sensor_by_sensorpush_id(session, sensorpush_id)
                if sensor:
                    sensor.location_id = new_location_id
                    sensor.updated_at = datetime.utcnow()
                    session.commit()
                    logger.info(f"Updated sensor {sensorpush_id} location to {new_location_id}")
                    return True
                else:
                    logger.warning(f"Sensor not found: {sensorpush_id}")
                    return False
            except Exception as e:
                session.rollback()
                logger.error(f"Failed to update sensor location: {e}")
                return False
    
    def get_unassigned_sensors(self) -> List[Dict[str, Any]]:
        """
        Get sensors that haven't been assigned to any location (location_id is null).
        Sensors with only location_id (but no local_sensor_id) are considered assigned for data collection.
        
        Returns:
            List of truly unassigned sensors (no location)
        """
        with get_session() as session:
            sensors = session.query(Sensor).filter(
                Sensor.is_active == True,
                Sensor.location_id.is_(None)
            ).all()
            
            sensor_list = []
            for sensor in sensors:
                sensor_list.append({
                    'id': sensor.id,
                    'sensorpush_id': sensor.sensorpush_id,
                    'local_sensor_id': sensor.local_sensor_id,
                    'location_id': sensor.location_id,
                    'sensor_name': sensor.sensor_name,
                    'device_type': sensor.device_type,
                    'is_active': sensor.is_active,
                    'needs_assignment': sensor.local_sensor_id is None or sensor.location_id is None
                })
            
            return sensor_list
    
    def get_assigned_sensors(self) -> List[Dict[str, Any]]:
        """
        Get sensors that have been assigned to locations (for display in web interface).
        
        Returns:
            List of sensors assigned to locations
        """
        with get_session() as session:
            sensors = session.query(Sensor).filter(
                Sensor.is_active == True,
                Sensor.location_id.isnot(None)
            ).all()
            
            sensor_list = []
            for sensor in sensors:
                sensor_list.append({
                    'id': sensor.id,
                    'sensorpush_id': sensor.sensorpush_id,
                    'local_sensor_id': sensor.local_sensor_id,
                    'location_id': sensor.location_id,
                    'sensor_name': sensor.sensor_name,
                    'device_type': sensor.device_type,
                    'is_active': sensor.is_active,
                    'battery_voltage': sensor.battery_voltage,
                    'rssi': sensor.rssi,
                    'last_seen': adjust_time_for_denmark(sensor.last_seen.strftime('%Y-%m-%d %H:%M:%S')) if sensor.last_seen else None,
                    'status': 'ASSIGNED' if sensor.local_sensor_id and sensor.location_id else 'LOCATION_ONLY'
                })
            
            return sensor_list
    
    def get_sensor_by_location(self, location_id: str) -> List[Dict[str, Any]]:
        """
        Get all sensors for a specific location.
        
        Args:
            location_id: Location ID
            
        Returns:
            List of sensors for the location
        """
        with get_session() as session:
            sensors = session.query(Sensor).filter(
                Sensor.location_id == location_id,
                Sensor.is_active == True
            ).all()
            
            sensor_list = []
            for sensor in sensors:
                sensor_list.append({
                    'id': sensor.id,
                    'sensorpush_id': sensor.sensorpush_id,
                    'local_sensor_id': sensor.local_sensor_id,
                    'location_id': sensor.location_id,
                    'sensor_name': sensor.sensor_name,
                    'device_type': sensor.device_type,
                    'is_active': sensor.is_active
                })
            
            return sensor_list
    
    def sync_gateways(self, sensorpush_gateways: Dict[str, Any]) -> Tuple[int, int]:
        """
        Sync gateways from SensorPush API with local database.
        
        Args:
            sensorpush_gateways: Gateways data from SensorPush API
            
        Returns:
            Tuple of (created_count, updated_count)
        """
        created_count = 0
        updated_count = 0
        
        with get_session() as session:
            try:
                for gateway_id, gateway_data in sensorpush_gateways.items():
                    # Check if gateway exists
                    existing_gateway = session.query(Gateway).filter(
                        Gateway.gateway_id == gateway_id
                    ).first()
                    
                    # Determine if gateway is active based on last_seen field
                    last_seen_str = gateway_data.get('last_seen')
                    is_active = last_seen_str is not None and last_seen_str != '1970-01-01T00:00:00.000Z'
                    
                    # Parse last_seen timestamp if available
                    last_seen_dt = None
                    if last_seen_str and last_seen_str != '1970-01-01T00:00:00.000Z':
                        try:
                            # Parse ISO format timestamp
                            last_seen_dt = datetime.fromisoformat(last_seen_str.replace('Z', '+00:00'))
                        except (ValueError, TypeError):
                            logger.warning(f"Failed to parse last_seen timestamp for gateway {gateway_id}: {last_seen_str}")
                    
                    gateway_info = {
                        'gateway_id': gateway_id,
                        'gateway_name': gateway_data.get('name', ''),
                        'is_active': is_active,
                        'last_seen': last_seen_dt,
                        'updated_at': datetime.utcnow()
                    }
                    
                    if existing_gateway:
                        # Update existing gateway
                        for key, value in gateway_info.items():
                            if key != 'gateway_id':
                                setattr(existing_gateway, key, value)
                        updated_count += 1
                        logger.debug(f"Updated gateway: {gateway_id}")
                    else:
                        # Create new gateway
                        new_gateway = Gateway(**gateway_info)
                        session.add(new_gateway)
                        created_count += 1
                        logger.debug(f"Created gateway: {gateway_id}")
                
                session.commit()
                logger.info(f"Gateway sync completed: {created_count} created, {updated_count} updated")
                
            except Exception as e:
                session.rollback()
                logger.error(f"Failed to sync gateways: {e}")
                raise
        
        return created_count, updated_count
    
    def store_readings(self, readings: List[Dict[str, Any]]) -> int:
        """
        Store sensor readings in database.
        
        Args:
            readings: List of converted sensor readings
            
        Returns:
            Number of readings stored
        """
        stored_count = 0
        
        with get_session() as session:
            try:
                for reading_data in readings:
                    # Get sensor by local sensor ID
                    sensor = get_sensor_by_local_id(session, reading_data['sensor_id'])
                    if not sensor:
                        logger.warning(f"Sensor not found: {reading_data['sensor_id']}")
                        continue
                    
                    # Parse record time
                    record_time_str = reading_data['record_time']
                    if record_time_str.endswith('Z'):
                        # Remove Z and add timezone offset
                        clean_timestamp = record_time_str[:-1] + '+00:00'
                    else:
                        clean_timestamp = record_time_str
                    record_time = datetime.fromisoformat(clean_timestamp)
                    
                    # Check if reading already exists
                    existing_reading = session.query(SensorReading).filter(
                        SensorReading.sensor_id == sensor.id,
                        SensorReading.record_time == record_time
                    ).first()
                    
                    if existing_reading:
                        logger.debug(f"Reading already exists: {sensor.local_sensor_id} at {record_time}")
                        continue
                    
                    # Create new reading
                    reading = SensorReading(
                        sensor_id=sensor.id,
                        record_time=record_time,
                        temperature=reading_data.get('temperature'),
                        relative_humidity=reading_data.get('relative_humidity'),
                        air_pressure=reading_data.get('air_pressure'),
                        pause=reading_data.get('pause', 0)
                    )
                    
                    session.add(reading)
                    stored_count += 1
                
                session.commit()
                logger.info(f"Stored {stored_count} new readings")
                
            except Exception as e:
                session.rollback()
                logger.error(f"Failed to store readings: {e}")
                raise
        
        return stored_count
    
    def get_sensors_for_fetch(self) -> List[Dict[str, Any]]:
        """
        Get sensors that need data fetching (all sensors assigned to a location).
        
        Returns:
            List of sensor information for fetching
        """
        with get_session() as session:
            # Get all sensors that have been assigned to a location (location_id is not null)
            # We don't require local_sensor_id to be assigned anymore
            sensors = session.query(Sensor).filter(
                Sensor.is_active == True,
                Sensor.location_id.isnot(None)
            ).all()
            
            sensor_list = []
            for sensor in sensors:
                sensor_state = get_sensor_state(session, sensor.id)
                if sensor_state:
                    sensor_list.append({
                        'id': sensor.id,
                        'sensorpush_id': sensor.sensorpush_id,
                        'local_sensor_id': sensor.local_sensor_id,
                        'location_id': sensor.location_id,
                        'last_fetch_timestamp': sensor_state.last_fetch_timestamp
                    })
            
            logger.debug(f"Found {len(sensor_list)} sensors assigned to locations for data fetching")
            return sensor_list
    
    def get_sensor_mapping(self) -> Dict[str, Dict[str, str]]:
        """
        Get sensor mapping from database for data conversion (sensors assigned to locations).
        
        Returns:
            Dictionary mapping SensorPush IDs to local sensor info
        """
        with get_session() as session:
            # Get sensors that have been assigned to a location (location_id is not null)
            # We don't require local_sensor_id to be assigned anymore
            sensors = session.query(Sensor).filter(
                Sensor.is_active == True,
                Sensor.location_id.isnot(None)
            ).all()
            
            mapping = {}
            for sensor in sensors:
                mapping[sensor.sensorpush_id] = {
                    'local_sensor_id': sensor.local_sensor_id,
                    'location_id': sensor.location_id
                }
            
            logger.debug(f"Retrieved mapping for {len(mapping)} sensors assigned to locations from database")
            return mapping
    
    def update_sensor_fetch_timestamp(self, sensor_id: int, timestamp: datetime):
        """
        Update last fetch timestamp for a sensor.
        
        Args:
            sensor_id: Sensor ID
            timestamp: New fetch timestamp
        """
        with get_session() as session:
            try:
                sensor_state = get_sensor_state(session, sensor_id)
                if sensor_state:
                    sensor_state.last_fetch_timestamp = timestamp
                    sensor_state.updated_at = datetime.utcnow()
                    session.commit()
                    logger.debug(f"Updated fetch timestamp for sensor {sensor_id}")
                else:
                    logger.warning(f"Sensor state not found for sensor {sensor_id}")
                    
            except Exception as e:
                session.rollback()
                logger.error(f"Failed to update fetch timestamp: {e}")
                raise
    
    def get_unuploaded_readings(self, limit: int = 1000) -> List[Dict[str, Any]]:
        """
        Get readings that haven't been uploaded to server.
        
        Args:
            limit: Maximum number of readings to return
            
        Returns:
            List of unuploaded readings
        """
        with get_session() as session:
            readings = get_unuploaded_readings(session, limit)
            
            reading_list = []
            for reading in readings:
                reading_list.append({
                    'id': reading.id,
                    'sensor_id': reading.sensor.local_sensor_id,
                    'sensor_name': f"Sensor {reading.sensor.local_sensor_id}",  # Default sensor name
                    'location_id': reading.sensor.location_id,
                    'record_time': reading.record_time.isoformat() + "Z" if reading.record_time.tzinfo is None else reading.record_time.astimezone().replace(tzinfo=None).isoformat() + "Z",
                    'temperature': reading.temperature,
                    'relative_humidity': reading.relative_humidity,
                    'air_pressure': reading.air_pressure,
                    'pause': reading.pause
                })
            
            logger.debug(f"Found {len(reading_list)} unuploaded readings")
            return reading_list
    
    def mark_readings_uploaded(self, reading_ids: List[int], success: bool = True, error_message: str = None):
        """
        Mark readings as uploaded.
        
        Args:
            reading_ids: List of reading IDs to mark
            success: Whether upload was successful
            error_message: Error message if upload failed
        """
        with get_session() as session:
            try:
                readings = session.query(SensorReading).filter(
                    SensorReading.id.in_(reading_ids)
                ).all()
                
                for reading in readings:
                    if success:
                        reading.uploaded_to_server = True
                        reading.upload_attempts += 1
                        reading.last_upload_attempt = datetime.utcnow()
                        reading.error_message = None
                    else:
                        reading.upload_attempts += 1
                        reading.last_upload_attempt = datetime.utcnow()
                        reading.error_message = error_message
                
                session.commit()
                logger.debug(f"Marked {len(readings)} readings as uploaded (success={success})")
                
            except Exception as e:
                session.rollback()
                logger.error(f"Failed to mark readings as uploaded: {e}")
                raise
    
    def log_upload_operation(
        self,
        batch_id: str,
        sensor_id: int,
        record_count: int,
        success: bool,
        error_message: str = None,
        response_data: str = None
    ):
        """
        Log upload operation.
        
        Args:
            batch_id: Upload batch ID
            sensor_id: Sensor ID
            record_count: Number of records uploaded
            success: Whether upload was successful
            error_message: Error message if failed
            response_data: Server response data
        """
        with get_session() as session:
            try:
                upload_log = UploadLog(
                    batch_id=batch_id,
                    sensor_id=sensor_id,
                    record_count=record_count,
                    success=success,
                    error_message=error_message,
                    response_data=response_data
                )
                
                session.add(upload_log)
                session.commit()
                logger.debug(f"Logged upload operation: {batch_id}")
                
            except Exception as e:
                session.rollback()
                logger.error(f"Failed to log upload operation: {e}")
                raise
    
    def cleanup_old_data(self, retention_days: int, batch_size: int = 1000) -> Dict[str, int]:
        """
        Clean up old data based on retention policy.
        
        Args:
            retention_days: Number of days to retain data
            batch_size: Number of records to process per batch
            
        Returns:
            Dictionary with cleanup statistics
        """
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
        
        stats = {
            'readings_deleted': 0,
            'upload_logs_deleted': 0,
            'error_logs_cleared': 0
        }
        
        with get_session() as session:
            try:
                # Clean up old sensor readings
                old_readings = get_old_readings(session, cutoff_date, batch_size)
                for reading in old_readings:
                    session.delete(reading)
                    stats['readings_deleted'] += 1
                
                # Clean up old upload logs
                old_upload_logs = session.query(UploadLog).filter(
                    UploadLog.uploaded_at < cutoff_date
                ).limit(batch_size).all()
                
                for log in old_upload_logs:
                    session.delete(log)
                    stats['upload_logs_deleted'] += 1
                
                # Clear old error messages from sensor state
                sensor_states = session.query(SensorState).filter(
                    SensorState.last_error_timestamp < cutoff_date
                ).all()
                
                for state in sensor_states:
                    state.last_error_message = None
                    state.last_error_timestamp = None
                    stats['error_logs_cleared'] += 1
                
                session.commit()
                logger.info(f"Cleanup completed: {stats}")
                
            except Exception as e:
                session.rollback()
                logger.error(f"Failed to cleanup old data: {e}")
                raise
        
        return stats
    
    def get_database_stats(self) -> Dict[str, Any]:
        """
        Get database statistics.
        
        Returns:
            Database statistics
        """
        with get_session() as session:
            try:
                stats = {}
                
                # Count records in each table
                stats['sensors'] = session.query(Sensor).count()
                stats['gateways'] = session.query(Gateway).count()
                stats['sensor_readings'] = session.query(SensorReading).count()
                stats['unuploaded_readings'] = session.query(SensorReading).filter(
                    SensorReading.uploaded_to_server == False
                ).count()
                stats['upload_logs'] = session.query(UploadLog).count()
                
                # Get oldest and newest readings
                oldest_reading = session.query(SensorReading).order_by(
                    SensorReading.record_time.asc()
                ).first()
                
                newest_reading = session.query(SensorReading).order_by(
                    SensorReading.record_time.desc()
                ).first()
                
                if oldest_reading:
                    stats['oldest_reading'] = oldest_reading.record_time.isoformat()
                if newest_reading:
                    stats['newest_reading'] = newest_reading.record_time.isoformat()
                
                return stats
                
            except Exception as e:
                logger.error(f"Failed to get database stats: {e}")
                return {}
