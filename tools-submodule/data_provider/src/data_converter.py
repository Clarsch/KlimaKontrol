"""
Data conversion utilities for transforming SensorPush data to server format.
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
import logging

from .logger import get_logger

logger = get_logger(__name__)


class DataConverter:
    """Converts SensorPush API data to server-compatible format."""
    
    def __init__(
        self,
        temperature_unit: str = "celsius",
        pressure_unit: str = "hpa",
        humidity_unit: str = "percentage"
    ):
        """
        Initialize data converter.
        
        Args:
            temperature_unit: Target temperature unit (celsius/fahrenheit)
            pressure_unit: Target pressure unit (hpa/inhg/pa)
            humidity_unit: Target humidity unit (percentage)
        """
        self.temperature_unit = temperature_unit.lower()
        self.pressure_unit = pressure_unit.lower()
        self.humidity_unit = humidity_unit.lower()
        
        logger.info(f"Data converter initialized: temp={self.temperature_unit}, pressure={self.pressure_unit}")
    
    def fahrenheit_to_celsius(self, fahrenheit: float) -> float:
        """Convert Fahrenheit to Celsius."""
        return (fahrenheit - 32) * 5 / 9
    
    def celsius_to_fahrenheit(self, celsius: float) -> float:
        """Convert Celsius to Fahrenheit."""
        return (celsius * 9 / 5) + 32
    
    def inhg_to_hpa(self, inhg: float) -> float:
        """Convert inches of mercury to hectopascals."""
        return inhg * 33.8638867
    
    def hpa_to_inhg(self, hpa: float) -> float:
        """Convert hectopascals to inches of mercury."""
        return hpa / 33.8638867
    
    def convert_temperature(self, temperature: float, from_unit: str = "fahrenheit") -> float:
        """
        Convert temperature between units.
        
        Args:
            temperature: Temperature value
            from_unit: Source unit (fahrenheit/celsius)
            
        Returns:
            Converted temperature value
        """
        if from_unit.lower() == "fahrenheit" and self.temperature_unit == "celsius":
            return self.fahrenheit_to_celsius(temperature)
        elif from_unit.lower() == "celsius" and self.temperature_unit == "fahrenheit":
            return self.celsius_to_fahrenheit(temperature)
        else:
            return temperature
    
    def convert_pressure(self, pressure: float, from_unit: str = "inhg") -> float:
        """
        Convert pressure between units.
        
        Args:
            pressure: Pressure value
            from_unit: Source unit (inhg/hpa/pa)
            
        Returns:
            Converted pressure value
        """
        # Convert to base unit (hPa) first
        if from_unit.lower() == "inhg":
            hpa = self.inhg_to_hpa(pressure)
        elif from_unit.lower() == "pa":
            hpa = pressure / 100  # Convert Pa to hPa
        else:  # Already hPa
            hpa = pressure
        
        # Convert to target unit
        if self.pressure_unit == "inhg":
            return self.hpa_to_inhg(hpa)
        elif self.pressure_unit == "pa":
            return hpa * 100  # Convert hPa to Pa
        else:  # Target is hPa
            return hpa
    
    def convert_humidity(self, humidity: float) -> float:
        """
        Convert humidity (currently just returns as-is since percentage is standard).
        
        Args:
            humidity: Humidity percentage value
            
        Returns:
            Humidity value (no conversion needed for percentage)
        """
        return humidity
    
    def convert_sensor_reading(
        self,
        sensorpush_data: Dict[str, Any],
        sensor_id: str,
        location_id: str
    ) -> Dict[str, Any]:
        """
        Convert a single SensorPush reading to server format.
        
        Args:
            sensorpush_data: Raw SensorPush reading data
            sensor_id: Local sensor ID
            location_id: Location ID
            
        Returns:
            Converted reading in server format
        """
        try:
            # Parse timestamp
            observed_time = sensorpush_data['observed']
            if observed_time.endswith('Z'):
                # Remove Z and add timezone offset
                clean_timestamp = observed_time[:-1] + '+00:00'
            else:
                clean_timestamp = observed_time
            record_time = datetime.fromisoformat(clean_timestamp)
            
            # Convert temperature
            temperature = None
            if 'temperature' in sensorpush_data and sensorpush_data['temperature'] is not None:
                temperature = self.convert_temperature(
                    sensorpush_data['temperature'], 
                    from_unit="fahrenheit"
                )
            
            # Convert humidity
            relative_humidity = None
            if 'humidity' in sensorpush_data and sensorpush_data['humidity'] is not None:
                relative_humidity = self.convert_humidity(sensorpush_data['humidity'])
            
            # Convert pressure
            air_pressure = None
            if 'barometric_pressure' in sensorpush_data and sensorpush_data['barometric_pressure'] is not None:
                air_pressure = self.convert_pressure(
                    sensorpush_data['barometric_pressure'],
                    from_unit="inhg"
                )
            
            # Create converted reading
            converted_reading = {
                "sensor_id": sensor_id,
                "sensor_name": f"Sensor {sensor_id}",  # Default sensor name
                "location_id": location_id,
                "record_time": record_time.isoformat() + "Z" if record_time.tzinfo is None else record_time.astimezone().replace(tzinfo=None).isoformat() + "Z",
                "temperature": temperature,
                "relative_humidity": relative_humidity,
                "air_pressure": air_pressure,
                "pause": 0  # Default value
            }
            
            logger.debug(f"Converted reading for sensor {sensor_id}: {record_time}")
            return converted_reading
            
        except Exception as e:
            logger.error(f"Failed to convert sensor reading: {e}")
            raise
    
    def convert_sensor_batch(
        self,
        sensorpush_response: Dict[str, Any],
        sensor_mapping: Dict[str, Dict[str, str]]
    ) -> List[Dict[str, Any]]:
        """
        Convert a batch of SensorPush readings to server format.
        
        Args:
            sensorpush_response: Raw SensorPush API response
            sensor_mapping: Mapping of SensorPush IDs to local sensor IDs and locations
            
        Returns:
            List of converted readings
        """
        converted_readings = []
        
        try:
            samples = sensorpush_response.get('sensors', {})
            total_samples = 0
            
            for sensorpush_id, readings in samples.items():
                if sensorpush_id not in sensor_mapping:
                    logger.warning(f"No mapping found for SensorPush ID: {sensorpush_id}")
                    continue
                
                mapping = sensor_mapping[sensorpush_id]
                local_sensor_id = mapping['local_sensor_id']
                location_id = mapping['location_id']
                
                for reading_data in readings:
                    try:
                        converted_reading = self.convert_sensor_reading(
                            reading_data,
                            local_sensor_id,
                            location_id
                        )
                        converted_readings.append(converted_reading)
                        total_samples += 1
                        
                    except Exception as e:
                        logger.error(f"Failed to convert reading for sensor {sensorpush_id}: {e}")
                        continue
            
            logger.info(f"Converted {total_samples} readings from SensorPush response")
            return converted_readings
            
        except Exception as e:
            logger.error(f"Failed to convert sensor batch: {e}")
            raise
    
    def validate_reading(self, reading: Dict[str, Any]) -> bool:
        """
        Validate a converted reading.
        
        Args:
            reading: Converted reading data
            
        Returns:
            True if valid, False otherwise
        """
        required_fields = ['sensor_id', 'location_id', 'record_time']
        
        # Check required fields
        for field in required_fields:
            if field not in reading or reading[field] is None:
                logger.warning(f"Reading missing required field: {field}")
                return False
        
        # Validate temperature range (if present)
        if reading.get('temperature') is not None:
            temp = reading['temperature']
            if not (-50 <= temp <= 100):  # Reasonable temperature range
                logger.warning(f"Temperature out of range: {temp}")
                return False
        
        # Validate humidity range (if present)
        if reading.get('relative_humidity') is not None:
            humidity = reading['relative_humidity']
            if not (0 <= humidity <= 100):
                logger.warning(f"Humidity out of range: {humidity}")
                return False
        
        # Validate pressure range (if present)
        if reading.get('air_pressure') is not None:
            pressure = reading['air_pressure']
            if not (800 <= pressure <= 1200):  # Reasonable pressure range in hPa
                logger.warning(f"Pressure out of range: {pressure}")
                return False
        
        return True
    
    def filter_valid_readings(self, readings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Filter out invalid readings from a list.
        
        Args:
            readings: List of converted readings
            
        Returns:
            List of valid readings
        """
        valid_readings = []
        invalid_count = 0
        
        for reading in readings:
            if self.validate_reading(reading):
                valid_readings.append(reading)
            else:
                invalid_count += 1
        
        if invalid_count > 0:
            logger.warning(f"Filtered out {invalid_count} invalid readings")
        
        logger.info(f"Validated {len(valid_readings)} readings")
        return valid_readings
    
    def get_conversion_stats(self, original_count: int, converted_count: int) -> Dict[str, Any]:
        """
        Get conversion statistics.
        
        Args:
            original_count: Number of original readings
            converted_count: Number of successfully converted readings
            
        Returns:
            Conversion statistics
        """
        success_rate = (converted_count / original_count * 100) if original_count > 0 else 0
        
        return {
            "original_count": original_count,
            "converted_count": converted_count,
            "success_rate": round(success_rate, 2),
            "failed_count": original_count - converted_count
        }
