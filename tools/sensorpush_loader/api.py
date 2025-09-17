"""
SensorPush Loader API
A clean interface for other programs to use the SensorPush loader functionality.
"""

import sys
import os
from typing import List, Dict, Any, Optional

# Add the root directory to the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
root_dir = os.path.dirname(parent_dir)

if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

try:
    from .modules.Authorization import Authorization
    from .modules.DataRequester import DataRequester
    from .modules.DataPullRunner import DataPullRunner, DataPullRunnerThread
    from utils.Logger import Logger
except ImportError:
    # Fallback for when imported from other locations
    from sensorpush_loader.modules.Authorization import Authorization
    from sensorpush_loader.modules.DataRequester import DataRequester
    from sensorpush_loader.modules.DataPullRunner import DataPullRunner, DataPullRunnerThread
    from utils.Logger import Logger


class SensorPushLoader:
    """
    Main API class for SensorPush data loading functionality.
    This class provides a clean interface for other programs to use.
    """
    
    def __init__(self, base_url: str = 'https://api.sensorpush.com', 
                 log_file: Optional[str] = None, 
                 logger_name: str = 'sensorpush_loader'):
        """
        Initialize the SensorPush Loader.
        
        Args:
            base_url: The SensorPush API base URL
            log_file: Optional log file path. If None, uses default location
            logger_name: Name for the logger instance
        """
        self.base_url = base_url
        
        # Set up logging
        if log_file is None:
            log_file = os.path.join(current_dir, f'{logger_name}.log')
        
        self.logger = Logger(logger_name, log_file)
        
        # Initialize components
        self.auth = Authorization(self.logger, base_url)
        self.data_requester = DataRequester(self.logger, self.auth, base_url)
        self.data_pull_runner = DataPullRunner(self.logger, self.auth)
        self.runner_thread = None
        
        self.logger.info('SensorPushLoader', 'Initialized successfully')
    
    def is_authorized(self) -> bool:
        """Check if the loader is authorized with the SensorPush API."""
        return self.auth.is_authorized()
    
    def wait_for_authorization(self, timeout: int = 60) -> bool:
        """
        Wait for authorization to complete.
        
        Args:
            timeout: Maximum time to wait in seconds
            
        Returns:
            True if authorized, False if timeout
        """
        import time
        start_time = time.time()
        
        while not self.is_authorized():
            if time.time() - start_time > timeout:
                self.logger.warning('SensorPushLoader', f'Authorization timeout after {timeout} seconds')
                return False
            time.sleep(1)
        
        return True
    
    def list_gateways(self) -> Dict[str, Any]:
        """Get list of gateways from SensorPush API."""
        return self.data_requester.list_gateways()
    
    def list_sensors(self) -> Dict[str, Any]:
        """Get list of sensors from SensorPush API."""
        return self.data_requester.list_sensors()
    
    def get_samples_simple(self, limit: int = 20) -> Dict[str, Any]:
        """
        Get simple sample data from SensorPush API.
        
        Args:
            limit: Maximum number of samples to retrieve
        """
        return self.data_requester.list_samples_simple()
    
    def get_samples(self, sensor_ids: List[str], max_records: int, 
                   start_time: str, end_time: str) -> Dict[str, Any]:
        """
        Get sample data for specific sensors and time range.
        
        Args:
            sensor_ids: List of sensor IDs to query
            max_records: Maximum number of records to retrieve
            start_time: Start time in format '2025-01-25T00:00:00.000Z'
            end_time: End time in format '2025-01-26T00:00:00.000Z'
        """
        return self.data_requester.list_samples(
            ';'.join(sensor_ids), max_records, start_time, end_time
        )
    
    def start_data_pull_runner(self, interval_minutes: int = 5) -> bool:
        """
        Start the background data pull runner.
        
        Args:
            interval_minutes: Minutes between each data pull
            
        Returns:
            True if started successfully, False if already running
        """
        if self.runner_thread is not None:
            self.logger.warning('SensorPushLoader', 'Data pull runner already running')
            return False
        
        self.runner_thread = DataPullRunnerThread(self.logger, self.data_pull_runner)
        self.runner_thread.set_time_interval(interval_minutes)
        self.runner_thread.start()
        
        self.logger.info('SensorPushLoader', f'Data pull runner started with {interval_minutes} minute interval')
        return True
    
    def stop_data_pull_runner(self) -> bool:
        """
        Stop the background data pull runner.
        
        Returns:
            True if stopped successfully, False if not running
        """
        if self.runner_thread is None:
            self.logger.warning('SensorPushLoader', 'Data pull runner not running')
            return False
        
        self.runner_thread.stop()
        self.runner_thread.join()
        self.runner_thread = None
        
        self.logger.info('SensorPushLoader', 'Data pull runner stopped')
        return True
    
    def get_observations(self) -> Dict[str, Any]:
        """Get the current observations from the data pull runner."""
        return self.data_pull_runner._observations
    
    def get_observation_count(self) -> int:
        """Get the number of observations currently stored."""
        return len(self.data_pull_runner._observations)
    
    def set_location(self, location_id: str):
        """Set the location ID for data uploads."""
        self.data_pull_runner.set_temp_location(location_id)
        self.logger.info('SensorPushLoader', f'Location set to: {location_id}')


# Convenience functions for easy import
def create_loader(base_url: str = 'https://api.sensorpush.com', 
                  log_file: Optional[str] = None) -> SensorPushLoader:
    """
    Create a new SensorPushLoader instance.
    
    Args:
        base_url: The SensorPush API base URL
        log_file: Optional log file path
        
    Returns:
        SensorPushLoader instance
    """
    return SensorPushLoader(base_url, log_file)


def quick_start(interval_minutes: int = 5) -> SensorPushLoader:
    """
    Quick start function that creates a loader and starts data pulling.
    
    Args:
        interval_minutes: Minutes between each data pull
        
    Returns:
        SensorPushLoader instance
    """
    loader = create_loader()
    
    if not loader.wait_for_authorization():
        raise RuntimeError("Failed to authorize with SensorPush API")
    
    loader.start_data_pull_runner(interval_minutes)
    return loader
