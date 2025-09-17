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


class DatabaseManager:
    """Manages database operations for the data provider service."""
    
    def __init__(self):
        """Initialize database manager."""
        logger.info("Database manager initialized")
    
    def sync_sensors(self, sensorpush_sensors: Dict[str, Any]) -> Tuple[int, int]:
        """
        Sync sensors from SensorPush API with local database.
        
        Args:
            sensorpush_sensors: Sensors data from SensorPush API
            
        Returns:
            Tuple of (created_count, updated_count)
        """
        created_count = 0
        updated_count = 0
        
        with get_session() as session:
            try:
                for sensorpush_id, sensor_data in sensorpush_sensors.items():
                    # Check if sensor exists
                    existing_sensor = get_sensor_by_sensorpush_id(session, sensorpush_id)
                    
                    sensor_info = {
                        'sensorpush_id': sensorpush_id,
                        'local_sensor_id': sensor_data.get('deviceId', sensorpush_id),
                        'location_id': 'unknown',  # Will be updated from mapping
                        'sensor_name': sensor_data.get('name', ''),
                        'device_type': sensor_data.get('type', ''),
                        'mac_address': sensor_data.get('address', ''),
                        'is_active': sensor_data.get('active', True),
                        'battery_voltage': sensor_data.get('battery_voltage'),
                        'rssi': sensor_data.get('rssi'),
                        'last_seen': datetime.utcnow() if sensor_data.get('active', True) else None,
                        'updated_at': datetime.utcnow()
                    }
                    
                    if existing_sensor:
                        # Update existing sensor
                        for key, value in sensor_info.items():
                            if key != 'sensorpush_id':  # Don't update the ID
                                setattr(existing_sensor, key, value)
                        updated_count += 1
                        logger.debug(f"Updated sensor: {sensorpush_id}")
                    else:
                        # Create new sensor
                        new_sensor = Sensor(**sensor_info)
                        session.add(new_sensor)
                        created_count += 1
                        logger.debug(f"Created sensor: {sensorpush_id}")
                        
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
                    
                    gateway_info = {
                        'gateway_id': gateway_id,
                        'gateway_name': gateway_data.get('name', ''),
                        'is_active': gateway_data.get('active', True),
                        'last_seen': datetime.utcnow() if gateway_data.get('active', True) else None,
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
                    record_time = datetime.fromisoformat(
                        reading_data['record_time'].replace('Z', '+00:00')
                    )
                    
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
        Get sensors that need data fetching.
        
        Returns:
            List of sensor information for fetching
        """
        with get_session() as session:
            sensors = get_active_sensors(session)
            
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
            
            logger.debug(f"Found {len(sensor_list)} sensors for data fetching")
            return sensor_list
    
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
                    'location_id': reading.sensor.location_id,
                    'record_time': reading.record_time.isoformat() + "Z",
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
