#!/usr/bin/env python3
"""
Data Provider Service - Main entry point.

A service for fetching sensor data from SensorPush API and uploading it to a local KlimaKontrol server.
"""

import argparse
import signal
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
import logging

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent / "src"))

from config.config_loader import load_config, ConfigLoader
from database.connection import initialize_database, close_database
from src.logger import initialize_logger, get_logger, log_service_start, log_service_stop
from src.sensorpush_client import SensorPushClient
from src.data_converter import DataConverter
from src.server_uploader import ServerUploader
from src.database_manager import DatabaseManager
from src.state_manager import StateManager
from src.cleanup_manager import CleanupManager

logger = get_logger(__name__)


class DataProviderService:
    """Main data provider service class."""
    
    def __init__(self, config_path: str = None):
        """
        Initialize the data provider service.
        
        Args:
            config_path: Path to configuration file
        """
        self.config = None
        self.sensorpush_client = None
        self.data_converter = None
        self.server_uploader = None
        self.db_manager = None
        self.state_manager = None
        self.cleanup_manager = None
        self.running = False
        
        # Load configuration
        self._load_config(config_path)
        
        # Initialize components
        self._initialize_components()
        
        # Setup signal handlers
        self._setup_signal_handlers()
    
    def _load_config(self, config_path: str = None):
        """Load service configuration."""
        try:
            self.config = load_config(config_path)
            logger.info("Configuration loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load configuration: {e}")
            sys.exit(1)
    
    def _initialize_components(self):
        """Initialize all service components."""
        try:
            # Initialize logging
            initialize_logger(
                log_level=self.config.logging.level,
                log_dir=self.config.logging.file_rotation.get('log_dir', './logs'),
                max_bytes=self.config.logging.file_rotation.get('max_bytes', 10485760),
                backup_count=self.config.logging.file_rotation.get('backup_count', 5),
                console_output=self.config.logging.console_output,
                structured_logging=self.config.logging.structured_logging
            )
            
            # Initialize database
            initialize_database(self.config.database.path)
            
            # Initialize managers
            self.db_manager = DatabaseManager()
            self.state_manager = StateManager()
            
            # Initialize SensorPush client
            self.sensorpush_client = SensorPushClient(
                api_url=self.config.sensorpush.api_url,
                email=self.config.sensorpush.credentials.email,
                password=self.config.sensorpush.credentials.password,
                max_samples_per_request=self.config.sensorpush.request_limits.max_samples_per_request,
                rate_limit_delay_ms=self.config.sensorpush.request_limits.rate_limit_delay_ms,
                max_sensors_per_batch=self.config.sensorpush.request_limits.max_sensors_per_batch
            )
            
            # Initialize data converter
            self.data_converter = DataConverter(
                temperature_unit=self.config.data_conversion.temperature_unit,
                pressure_unit=self.config.data_conversion.pressure_unit,
                humidity_unit=self.config.data_conversion.humidity_unit
            )
            
            # Initialize server uploader
            self.server_uploader = ServerUploader(
                base_url=self.config.server.base_url,
                upload_endpoint=self.config.server.upload_endpoint,
                batch_upload_endpoint=self.config.server.batch_upload_endpoint,
                auth_token=self.config.server.auth.token,
                timeout_seconds=self.config.server.timeout_seconds,
                retry_attempts=self.config.server.retry_attempts
            )
            
            # Initialize cleanup manager
            self.cleanup_manager = CleanupManager(
                database_manager=self.db_manager,
                state_manager=self.state_manager,
                backup_enabled=self.config.database.backup_enabled,
                backup_retention_days=self.config.database.backup_retention_days
            )
            
            logger.info("All components initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize components: {e}")
            sys.exit(1)
    
    def _setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown."""
        def signal_handler(signum, frame):
            logger.info(f"Received signal {signum}, initiating graceful shutdown...")
            self.stop()
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
    
    def start(self):
        """Start the data provider service."""
        log_service_start("Data Provider Service")
        
        # Set service start time
        self.state_manager.set_service_start_time(datetime.utcnow())
        
        # Test connections
        if not self._test_connections():
            logger.error("Connection tests failed, exiting")
            sys.exit(1)
        
        # Initialize database if needed
        if not self._is_database_initialized():
            logger.info("Initializing database...")
            self._initialize_database()
        
        # Restore state from backup
        self.state_manager.restore_state()
        
        self.running = True
        logger.info("Data provider service started")
        
        try:
            while self.running:
                self._run_cycle()
                time.sleep(self.config.service.frequency_minutes * 60)
                
        except KeyboardInterrupt:
            logger.info("Service interrupted by user")
        except Exception as e:
            logger.error(f"Service error: {e}")
        finally:
            self.stop()
    
    def stop(self):
        """Stop the data provider service."""
        if not self.running:
            return
        
        self.running = False
        log_service_stop("Data Provider Service")
        
        # Backup state
        self.state_manager.backup_state()
        
        # Close connections
        if self.sensorpush_client:
            self.sensorpush_client.close()
        if self.server_uploader:
            self.server_uploader.close()
        
        close_database()
        logger.info("Data provider service stopped")
    
    def _test_connections(self) -> bool:
        """Test all external connections."""
        logger.info("Testing connections...")
        
        # Test SensorPush API
        if not self.sensorpush_client.test_connection():
            logger.error("SensorPush API connection failed")
            return False
        
        # Test local server
        if not self.server_uploader.test_connection():
            logger.error("Local server connection failed")
            return False
        
        logger.info("All connections successful")
        return True
    
    def _is_database_initialized(self) -> bool:
        """Check if database is initialized."""
        try:
            from database.connection import get_database
            db = get_database()
            table_info = db.get_table_info()
            return len(table_info) > 0
        except Exception:
            return False
    
    def _initialize_database(self):
        """Initialize database tables."""
        try:
            from database.connection import get_database
            db = get_database()
            db.create_tables()
            logger.info("Database initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            raise
    
    def _run_cycle(self):
        """Run one service cycle."""
        cycle_start = datetime.utcnow()
        logger.info("Starting service cycle")
        
        try:
            # Sync sensors if needed
            if self.state_manager.is_sensor_sync_due(self.config.service.sensor_sync_frequency_hours):
                self._sync_sensors()
            
            # Fetch and process data
            self._fetch_and_process_data()
            
            # Upload data to server
            self._upload_data()
            
            # Run cleanup if needed
            if self.cleanup_manager.is_cleanup_due(self.config.data_retention.cleanup_frequency_hours):
                self._run_cleanup()
            
            # Update state
            self.state_manager.set_last_data_fetch(cycle_start)
            self.state_manager.increment_counter("total_fetches")
            
            cycle_duration = (datetime.utcnow() - cycle_start).total_seconds()
            logger.info(f"Service cycle completed in {cycle_duration:.2f} seconds")
            
        except Exception as e:
            logger.error(f"Service cycle failed: {e}")
            self.state_manager.increment_counter("total_errors")
            raise
    
    def _sync_sensors(self):
        """Sync sensors from SensorPush API."""
        logger.info("Syncing sensors...")
        
        try:
            # Get sensors and gateways from SensorPush
            sensors_data = self.sensorpush_client.get_sensors()
            gateways_data = self.sensorpush_client.get_gateways()
            
            # Sync with database
            sensor_created, sensor_updated = self.db_manager.sync_sensors(sensors_data.get('sensors', {}))
            gateway_created, gateway_updated = self.db_manager.sync_gateways(gateways_data.get('gateways', {}))
            
            # Update sync timestamp
            self.state_manager.set_last_sensor_sync(datetime.utcnow())
            
            logger.info(f"Sensor sync completed: {sensor_created} created, {sensor_updated} updated")
            logger.info(f"Gateway sync completed: {gateway_created} created, {gateway_updated} updated")
            
        except Exception as e:
            logger.error(f"Sensor sync failed: {e}")
            raise
    
    def _fetch_and_process_data(self):
        """Fetch data from SensorPush and process it."""
        logger.info("Fetching and processing data...")
        
        try:
            # Get sensors that need data fetching
            sensors = self.db_manager.get_sensors_for_fetch()
            if not sensors:
                logger.info("No sensors found for data fetching")
                return
            
            # Create sensor batches
            sensorpush_ids = [s['sensorpush_id'] for s in sensors]
            sensor_batches = self.sensorpush_client.create_sensor_batches(sensorpush_ids)
            
            # Fetch data for each batch
            all_readings = []
            for batch in sensor_batches:
                batch_sensors = [s for s in sensors if s['sensorpush_id'] in batch]
                
                # Determine time range for this batch
                start_time = min(s['last_fetch_timestamp'] for s in batch_sensors)
                end_time = datetime.utcnow()
                
                # Fetch samples
                batch_result = self.sensorpush_client.get_samples(batch, start_time, end_time)
                
                # Convert data
                sensor_mapping = {
                    s['sensorpush_id']: {
                        'local_sensor_id': s['local_sensor_id'],
                        'location_id': s['location_id']
                    }
                    for s in batch_sensors
                }
                
                converted_readings = self.data_converter.convert_sensor_batch(
                    batch_result, sensor_mapping
                )
                
                # Filter valid readings
                valid_readings = self.data_converter.filter_valid_readings(converted_readings)
                all_readings.extend(valid_readings)
                
                # Update fetch timestamps
                for sensor in batch_sensors:
                    self.db_manager.update_sensor_fetch_timestamp(
                        sensor['id'], end_time
                    )
            
            # Store readings in database
            if all_readings:
                stored_count = self.db_manager.store_readings(all_readings)
                logger.info(f"Stored {stored_count} new readings")
            else:
                logger.info("No new readings to store")
                
        except Exception as e:
            logger.error(f"Data fetch and processing failed: {e}")
            raise
    
    def _upload_data(self):
        """Upload data to local server."""
        logger.info("Uploading data to server...")
        
        try:
            # Get unuploaded readings
            readings = self.db_manager.get_unuploaded_readings(self.config.service.batch_size)
            if not readings:
                logger.info("No unuploaded readings found")
                return
            
            # Upload in chunks
            upload_result = self.server_uploader.upload_readings_chunked(
                readings, self.config.service.batch_size
            )
            
            if upload_result['success']:
                # Mark readings as uploaded
                reading_ids = [r['id'] for r in readings]
                self.db_manager.mark_readings_uploaded(reading_ids, success=True)
                
                # Update upload timestamp
                self.state_manager.set_last_upload(datetime.utcnow())
                self.state_manager.increment_counter("total_uploads")
                
                logger.info(f"Successfully uploaded {upload_result['total_count']} readings")
            else:
                # Mark readings as failed
                reading_ids = [r['id'] for r in readings]
                self.db_manager.mark_readings_uploaded(
                    reading_ids, 
                    success=False, 
                    error_message=upload_result.get('error', 'Unknown error')
                )
                
                logger.error(f"Upload failed: {upload_result.get('error', 'Unknown error')}")
                
        except Exception as e:
            logger.error(f"Data upload failed: {e}")
            raise
    
    def _run_cleanup(self):
        """Run data cleanup operation."""
        logger.info("Running data cleanup...")
        
        try:
            cleanup_stats = self.cleanup_manager.run_cleanup(
                sensor_readings_days=self.config.data_retention.sensor_readings_days,
                upload_logs_days=self.config.data_retention.upload_logs_days,
                error_logs_days=self.config.data_retention.error_logs_days,
                batch_size=self.config.data_retention.batch_cleanup_size,
                vacuum_after_cleanup=self.config.data_retention.vacuum_after_cleanup
            )
            
            if cleanup_stats['success']:
                logger.info(f"Cleanup completed: {cleanup_stats['space_saved_mb']}MB saved")
            else:
                logger.error(f"Cleanup failed: {cleanup_stats.get('error', 'Unknown error')}")
                
        except Exception as e:
            logger.error(f"Cleanup operation failed: {e}")
            raise


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Data Provider Service")
    parser.add_argument(
        "--config", 
        help="Path to configuration file",
        default="config/config.json"
    )
    parser.add_argument(
        "--init-db",
        action="store_true",
        help="Initialize database and exit"
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug mode"
    )
    parser.add_argument(
        "--log-level",
        choices=['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'],
        help="Set log level"
    )
    
    args = parser.parse_args()
    
    # Initialize logging first
    log_level = args.log_level or ('DEBUG' if args.debug else 'INFO')
    initialize_logger(log_level=log_level)
    
    try:
        # Initialize service
        service = DataProviderService(args.config)
        
        if args.init_db:
            logger.info("Initializing database...")
            service._initialize_database()
            logger.info("Database initialization completed")
            return
        
        # Start service
        service.start()
        
    except KeyboardInterrupt:
        logger.info("Service interrupted by user")
    except Exception as e:
        logger.error(f"Service failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
