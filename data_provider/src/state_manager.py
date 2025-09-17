"""
Service state management for tracking timestamps and service status.
"""

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, Optional
import logging

from database.connection import get_session
from database.models import ServiceState

from .logger import get_logger

logger = get_logger(__name__)


class StateManager:
    """Manages service state and timestamps."""
    
    def __init__(self, state_file_path: str = "./data/service_state.json"):
        """
        Initialize state manager.
        
        Args:
            state_file_path: Path to backup state file
        """
        self.state_file_path = Path(state_file_path)
        self.state_file_path.parent.mkdir(parents=True, exist_ok=True)
        
        logger.info("State manager initialized")
    
    def _get_state_value(self, key: str, default: Any = None) -> Any:
        """
        Get state value from database.
        
        Args:
            key: State key
            default: Default value if key not found
            
        Returns:
            State value
        """
        with get_session() as session:
            try:
                state = session.query(ServiceState).filter(ServiceState.key == key).first()
                if state:
                    # Try to parse as JSON, fallback to string
                    try:
                        return json.loads(state.value)
                    except (json.JSONDecodeError, TypeError):
                        return state.value
                return default
            except Exception as e:
                logger.error(f"Failed to get state value for key '{key}': {e}")
                return default
    
    def _set_state_value(self, key: str, value: Any):
        """
        Set state value in database.
        
        Args:
            key: State key
            value: State value
        """
        with get_session() as session:
            try:
                # Convert value to JSON string
                if isinstance(value, (dict, list)):
                    value_str = json.dumps(value)
                else:
                    value_str = str(value)
                
                state = session.query(ServiceState).filter(ServiceState.key == key).first()
                if state:
                    state.value = value_str
                    state.updated_at = datetime.utcnow()
                else:
                    state = ServiceState(key=key, value=value_str)
                    session.add(state)
                
                session.commit()
                logger.debug(f"Set state value: {key} = {value}")
                
            except Exception as e:
                session.rollback()
                logger.error(f"Failed to set state value for key '{key}': {e}")
                raise
    
    def get_last_sensor_sync(self) -> Optional[datetime]:
        """
        Get last sensor synchronization timestamp.
        
        Returns:
            Last sensor sync timestamp or None
        """
        timestamp_str = self._get_state_value("last_sensor_sync")
        if timestamp_str:
            try:
                return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            except (ValueError, TypeError):
                logger.warning(f"Invalid timestamp format: {timestamp_str}")
        return None
    
    def set_last_sensor_sync(self, timestamp: datetime):
        """
        Set last sensor synchronization timestamp.
        
        Args:
            timestamp: Sync timestamp
        """
        self._set_state_value("last_sensor_sync", timestamp.isoformat() + "Z")
    
    def get_last_data_fetch(self) -> Optional[datetime]:
        """
        Get last data fetch timestamp.
        
        Returns:
            Last data fetch timestamp or None
        """
        timestamp_str = self._get_state_value("last_data_fetch")
        if timestamp_str:
            try:
                return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            except (ValueError, TypeError):
                logger.warning(f"Invalid timestamp format: {timestamp_str}")
        return None
    
    def set_last_data_fetch(self, timestamp: datetime):
        """
        Set last data fetch timestamp.
        
        Args:
            timestamp: Fetch timestamp
        """
        self._set_state_value("last_data_fetch", timestamp.isoformat() + "Z")
    
    def get_last_upload(self) -> Optional[datetime]:
        """
        Get last successful upload timestamp.
        
        Returns:
            Last upload timestamp or None
        """
        timestamp_str = self._get_state_value("last_upload")
        if timestamp_str:
            try:
                return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            except (ValueError, TypeError):
                logger.warning(f"Invalid timestamp format: {timestamp_str}")
        return None
    
    def set_last_upload(self, timestamp: datetime):
        """
        Set last successful upload timestamp.
        
        Args:
            timestamp: Upload timestamp
        """
        self._set_state_value("last_upload", timestamp.isoformat() + "Z")
    
    def get_last_cleanup(self) -> Optional[datetime]:
        """
        Get last cleanup operation timestamp.
        
        Returns:
            Last cleanup timestamp or None
        """
        timestamp_str = self._get_state_value("last_cleanup")
        if timestamp_str:
            try:
                return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            except (ValueError, TypeError):
                logger.warning(f"Invalid timestamp format: {timestamp_str}")
        return None
    
    def set_last_cleanup(self, timestamp: datetime):
        """
        Set last cleanup operation timestamp.
        
        Args:
            timestamp: Cleanup timestamp
        """
        self._set_state_value("last_cleanup", timestamp.isoformat() + "Z")
    
    def get_service_stats(self) -> Dict[str, Any]:
        """
        Get service statistics.
        
        Returns:
            Service statistics
        """
        return {
            "last_sensor_sync": self.get_last_sensor_sync(),
            "last_data_fetch": self.get_last_data_fetch(),
            "last_upload": self.get_last_upload(),
            "last_cleanup": self.get_last_cleanup(),
            "total_fetches": self._get_state_value("total_fetches", 0),
            "total_uploads": self._get_state_value("total_uploads", 0),
            "total_errors": self._get_state_value("total_errors", 0),
            "service_start_time": self._get_state_value("service_start_time")
        }
    
    def increment_counter(self, counter_name: str, increment: int = 1):
        """
        Increment a counter.
        
        Args:
            counter_name: Name of the counter
            increment: Amount to increment by
        """
        current_value = self._get_state_value(counter_name, 0)
        new_value = current_value + increment
        self._set_state_value(counter_name, new_value)
        logger.debug(f"Incremented {counter_name}: {current_value} -> {new_value}")
    
    def set_service_start_time(self, timestamp: datetime):
        """
        Set service start time.
        
        Args:
            timestamp: Service start timestamp
        """
        self._set_state_value("service_start_time", timestamp.isoformat() + "Z")
    
    def get_service_uptime(self) -> Optional[timedelta]:
        """
        Get service uptime.
        
        Returns:
            Service uptime or None if start time not set
        """
        start_time_str = self._get_state_value("service_start_time")
        if start_time_str:
            try:
                start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
                return datetime.utcnow() - start_time
            except (ValueError, TypeError):
                logger.warning(f"Invalid start time format: {start_time_str}")
        return None
    
    def backup_state(self) -> bool:
        """
        Backup current state to JSON file.
        
        Returns:
            True if backup successful, False otherwise
        """
        try:
            state_data = self.get_service_stats()
            
            with open(self.state_file_path, 'w', encoding='utf-8') as f:
                json.dump(state_data, f, indent=2, default=str)
            
            logger.info(f"State backed up to {self.state_file_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to backup state: {e}")
            return False
    
    def restore_state(self) -> bool:
        """
        Restore state from JSON file.
        
        Returns:
            True if restore successful, False otherwise
        """
        try:
            if not self.state_file_path.exists():
                logger.warning(f"State file not found: {self.state_file_path}")
                return False
            
            with open(self.state_file_path, 'r', encoding='utf-8') as f:
                state_data = json.load(f)
            
            # Restore timestamps
            if "last_sensor_sync" in state_data and state_data["last_sensor_sync"]:
                self.set_last_sensor_sync(
                    datetime.fromisoformat(state_data["last_sensor_sync"].replace('Z', '+00:00'))
                )
            
            if "last_data_fetch" in state_data and state_data["last_data_fetch"]:
                self.set_last_data_fetch(
                    datetime.fromisoformat(state_data["last_data_fetch"].replace('Z', '+00:00'))
                )
            
            if "last_upload" in state_data and state_data["last_upload"]:
                self.set_last_upload(
                    datetime.fromisoformat(state_data["last_upload"].replace('Z', '+00:00'))
                )
            
            if "last_cleanup" in state_data and state_data["last_cleanup"]:
                self.set_last_cleanup(
                    datetime.fromisoformat(state_data["last_cleanup"].replace('Z', '+00:00'))
                )
            
            # Restore counters
            if "total_fetches" in state_data:
                self._set_state_value("total_fetches", state_data["total_fetches"])
            
            if "total_uploads" in state_data:
                self._set_state_value("total_uploads", state_data["total_uploads"])
            
            if "total_errors" in state_data:
                self._set_state_value("total_errors", state_data["total_errors"])
            
            logger.info(f"State restored from {self.state_file_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to restore state: {e}")
            return False
    
    def reset_state(self):
        """Reset all state values."""
        with get_session() as session:
            try:
                # Clear all state entries
                session.query(ServiceState).delete()
                session.commit()
                logger.info("Service state reset")
                
            except Exception as e:
                session.rollback()
                logger.error(f"Failed to reset state: {e}")
                raise
    
    def is_cleanup_due(self, cleanup_frequency_hours: int) -> bool:
        """
        Check if cleanup is due.
        
        Args:
            cleanup_frequency_hours: Cleanup frequency in hours
            
        Returns:
            True if cleanup is due, False otherwise
        """
        last_cleanup = self.get_last_cleanup()
        if not last_cleanup:
            return True  # Never cleaned up
        
        next_cleanup = last_cleanup + timedelta(hours=cleanup_frequency_hours)
        return datetime.utcnow() >= next_cleanup
    
    def is_sensor_sync_due(self, sync_frequency_hours: int) -> bool:
        """
        Check if sensor sync is due.
        
        Args:
            sync_frequency_hours: Sync frequency in hours
            
        Returns:
            True if sync is due, False otherwise
        """
        last_sync = self.get_last_sensor_sync()
        if not last_sync:
            return True  # Never synced
        
        next_sync = last_sync + timedelta(hours=sync_frequency_hours)
        return datetime.utcnow() >= next_sync
