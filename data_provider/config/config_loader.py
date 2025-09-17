"""
Configuration loader and validation for the data provider service.
"""

import json
import os
from pathlib import Path
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field, validator
import logging

logger = logging.getLogger(__name__)


class DatabaseConfig(BaseModel):
    """Database configuration settings."""
    type: str = "sqlite"
    path: str = "./data/sensor_data.db"
    backup_enabled: bool = True
    backup_frequency_hours: int = 24
    backup_retention_days: int = 7
    vacuum_frequency_hours: int = 168


class SensorPushCredentials(BaseModel):
    """SensorPush API credentials."""
    email: str
    password: str


class SensorPushRequestLimits(BaseModel):
    """SensorPush API request limits."""
    max_samples_per_request: int = 1000
    rate_limit_delay_ms: int = 60000
    max_sensors_per_batch: int = 50


class SensorPushConfig(BaseModel):
    """SensorPush API configuration."""
    api_url: str = "https://api.sensorpush.com"
    credentials: SensorPushCredentials
    request_limits: SensorPushRequestLimits


class ServerAuth(BaseModel):
    """Server authentication configuration."""
    type: str = "jwt"
    token: str


class ServerConfig(BaseModel):
    """Local server configuration."""
    base_url: str = "http://localhost:3000"
    upload_endpoint: str = "/api/data/reading/dataReading"
    batch_upload_endpoint: str = "/api/data/upload"
    auth: ServerAuth
    timeout_seconds: int = 30
    retry_attempts: int = 3


class ServiceConfig(BaseModel):
    """Service operation configuration."""
    frequency_minutes: int = 15
    log_level: str = "INFO"
    data_directory: str = "./data"
    max_retry_attempts: int = 3
    retry_delay_seconds: int = 30
    batch_size: int = 100
    sensor_sync_frequency_hours: int = 24

    @validator('log_level')
    def validate_log_level(cls, v):
        valid_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        if v.upper() not in valid_levels:
            raise ValueError(f'log_level must be one of {valid_levels}')
        return v.upper()


class SensorsConfig(BaseModel):
    """Sensor configuration."""
    default_location: str = "bov"
    auto_discover: bool = True
    auto_assign_location: bool = True


class DataConversionConfig(BaseModel):
    """Data conversion settings."""
    temperature_unit: str = "celsius"
    pressure_unit: str = "hpa"
    humidity_unit: str = "percentage"

    @validator('temperature_unit')
    def validate_temperature_unit(cls, v):
        valid_units = ['celsius', 'fahrenheit']
        if v.lower() not in valid_units:
            raise ValueError('temperature_unit must be celsius or fahrenheit')
        return v.lower()

    @validator('pressure_unit')
    def validate_pressure_unit(cls, v):
        valid_units = ['hpa', 'inhg', 'pa']
        if v.lower() not in valid_units:
            raise ValueError('pressure_unit must be hpa, inhg, or pa')
        return v.lower()


class DataRetentionConfig(BaseModel):
    """Data retention policy configuration."""
    sensor_readings_days: int = 365
    upload_logs_days: int = 90
    error_logs_days: int = 30
    cleanup_frequency_hours: int = 24
    batch_cleanup_size: int = 1000
    vacuum_after_cleanup: bool = True


class LoggingFileRotation(BaseModel):
    """Log file rotation configuration."""
    max_bytes: int = 10485760  # 10MB
    backup_count: int = 5


class LoggingConfig(BaseModel):
    """Logging configuration."""
    level: str = "INFO"
    file_rotation: LoggingFileRotation
    console_output: bool = True
    structured_logging: bool = True


class DataProviderConfig(BaseModel):
    """Complete data provider configuration."""
    database: DatabaseConfig
    sensorpush: SensorPushConfig
    server: ServerConfig
    service: ServiceConfig
    sensors: SensorsConfig
    data_conversion: DataConversionConfig
    data_retention: DataRetentionConfig
    logging: LoggingConfig


class ConfigLoader:
    """Configuration loader and validator."""
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize configuration loader.
        
        Args:
            config_path: Path to configuration file. If None, uses default path.
        """
        if config_path is None:
            config_path = os.path.join(os.path.dirname(__file__), "config.json")
        
        self.config_path = Path(config_path)
        self._config: Optional[DataProviderConfig] = None
    
    def load_config(self) -> DataProviderConfig:
        """
        Load and validate configuration from file.
        
        Returns:
            Validated configuration object.
            
        Raises:
            FileNotFoundError: If configuration file doesn't exist.
            ValueError: If configuration is invalid.
        """
        if not self.config_path.exists():
            raise FileNotFoundError(
                f"Configuration file not found: {self.config_path}. "
                f"Please copy config.example.json to config.json and configure it."
            )
        
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                config_data = json.load(f)
            
            self._config = DataProviderConfig(**config_data)
            logger.info(f"Configuration loaded successfully from {self.config_path}")
            return self._config
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in configuration file: {e}")
        except Exception as e:
            raise ValueError(f"Configuration validation failed: {e}")
    
    def get_config(self) -> DataProviderConfig:
        """
        Get loaded configuration.
        
        Returns:
            Configuration object.
            
        Raises:
            RuntimeError: If configuration hasn't been loaded.
        """
        if self._config is None:
            raise RuntimeError("Configuration not loaded. Call load_config() first.")
        return self._config
    
    def save_config(self, config: DataProviderConfig) -> None:
        """
        Save configuration to file.
        
        Args:
            config: Configuration object to save.
        """
        config_dict = config.dict()
        
        # Ensure directory exists
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(self.config_path, 'w', encoding='utf-8') as f:
            json.dump(config_dict, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Configuration saved to {self.config_path}")
    
    def create_default_config(self) -> DataProviderConfig:
        """
        Create default configuration.
        
        Returns:
            Default configuration object.
        """
        return DataProviderConfig(
            database=DatabaseConfig(),
            sensorpush=SensorPushConfig(
                credentials=SensorPushCredentials(
                    email="your-email@example.com",
                    password="your-password"
                )
            ),
            server=ServerConfig(
                auth=ServerAuth(token="your-jwt-token-here")
            ),
            service=ServiceConfig(),
            sensors=SensorsConfig(),
            data_conversion=DataConversionConfig(),
            data_retention=DataRetentionConfig(),
            logging=LoggingConfig()
        )


def load_config(config_path: Optional[str] = None) -> DataProviderConfig:
    """
    Convenience function to load configuration.
    
    Args:
        config_path: Path to configuration file.
        
    Returns:
        Loaded configuration object.
    """
    loader = ConfigLoader(config_path)
    return loader.load_config()


if __name__ == "__main__":
    # Test configuration loading
    try:
        config = load_config()
        print("Configuration loaded successfully!")
        print(f"Database path: {config.database.path}")
        print(f"Service frequency: {config.service.frequency_minutes} minutes")
    except Exception as e:
        print(f"Configuration error: {e}")
