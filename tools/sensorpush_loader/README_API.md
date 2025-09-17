# SensorPush Loader API

A clean Python API for interacting with the SensorPush service. This module can be imported and used by other programs.

## Features

- **Easy Integration**: Simple API for other Python programs
- **Flexible Import**: Works when imported from various locations
- **Background Data Pulling**: Continuous data collection with configurable intervals
- **Comprehensive Logging**: Built-in logging with configurable output
- **Error Handling**: Robust error handling and fallback mechanisms

## Installation

The sensorpush loader is part of the KlimaKontrol project. To use it in your programs:

1. Ensure the KlimaKontrol project is in your Python path
2. Import the API module

## Quick Start

```python
from tools.sensorpush_loader.api import quick_start

# Quick start with automatic authorization and data pulling
loader = quick_start(interval_minutes=5)
print(f"Collected {loader.get_observation_count()} observations")
loader.stop_data_pull_runner()
```

## Basic Usage

```python
from tools.sensorpush_loader.api import SensorPushLoader

# Create a loader instance
loader = SensorPushLoader()

# Wait for authorization
if loader.wait_for_authorization(timeout=60):
    # Get sensor data
    sensors = loader.list_sensors()
    gateways = loader.list_gateways()
    
    # Get sample data
    samples = loader.get_samples_simple(limit=20)
    
    # Start continuous data pulling
    loader.start_data_pull_runner(interval_minutes=5)
    
    # Get collected observations
    observations = loader.get_observations()
    print(f"Collected {len(observations)} observations")
```

## API Reference

### SensorPushLoader Class

#### Constructor
```python
SensorPushLoader(base_url='https://api.sensorpush.com', 
                 log_file=None, 
                 logger_name='sensorpush_loader')
```

#### Methods

##### Authorization
- `is_authorized() -> bool`: Check if authorized with SensorPush API
- `wait_for_authorization(timeout=60) -> bool`: Wait for authorization to complete

##### Data Retrieval
- `list_gateways() -> Dict[str, Any]`: Get list of gateways
- `list_sensors() -> Dict[str, Any]`: Get list of sensors
- `get_samples_simple(limit=20) -> Dict[str, Any]`: Get simple sample data
- `get_samples(sensor_ids, max_records, start_time, end_time) -> Dict[str, Any]`: Get specific sample data

##### Data Pulling
- `start_data_pull_runner(interval_minutes=5) -> bool`: Start background data pulling
- `stop_data_pull_runner() -> bool`: Stop background data pulling
- `get_observations() -> Dict[str, Any]`: Get collected observations
- `get_observation_count() -> int`: Get number of observations

##### Configuration
- `set_location(location_id: str)`: Set location ID for data uploads

### Convenience Functions

#### create_loader()
```python
create_loader(base_url='https://api.sensorpush.com', log_file=None) -> SensorPushLoader
```
Create a new SensorPushLoader instance.

#### quick_start()
```python
quick_start(interval_minutes=5) -> SensorPushLoader
```
Create a loader, authorize, and start data pulling in one call.

## Import Examples

### From the tools directory:
```python
from sensorpush_loader.api import SensorPushLoader
```

### From the project root:
```python
from tools.sensorpush_loader.api import SensorPushLoader
```

### From anywhere in the project:
```python
import sys
sys.path.append('/path/to/KlimaKontrol')
from tools.sensorpush_loader.api import SensorPushLoader
```

## Configuration

### Logging
The loader uses the KlimaKontrol Logger utility. Log files are created in the sensorpush_loader directory by default.

### API Configuration
The loader reads configuration from `config.json` in the sensorpush_loader directory. This file should contain your SensorPush API credentials.

Example `config.json`:
```json
{
    "email": "your-email@example.com",
    "password": "your-password"
}
```

## Error Handling

The API includes comprehensive error handling:

- **Import Errors**: Fallback import mechanisms for different usage contexts
- **Authorization Errors**: Timeout handling and retry logic
- **API Errors**: Proper error logging and graceful degradation
- **Threading Errors**: Safe thread management for background operations

## Thread Safety

The `SensorPushLoader` class is designed to be thread-safe for most operations. However, when using the data pull runner, it's recommended to:

- Only start one data pull runner per loader instance
- Properly stop the runner before destroying the loader instance
- Use the provided methods for thread management

## Examples

See `example_usage.py` for comprehensive usage examples including:
- Basic data retrieval
- Continuous data pulling
- Quick start scenarios
- Error handling patterns

## Dependencies

- `requests`: For HTTP API calls
- `asyncio`: For asynchronous operations
- `threading`: For background data pulling
- `datetime`: For time handling
- `utils.Logger`: KlimaKontrol logging utility
- `klima_kontrol_uploader`: For data upload functionality

## Troubleshooting

### Import Issues
If you encounter import errors, ensure:
1. The KlimaKontrol project is in your Python path
2. All required dependencies are installed
3. The sensorpush_loader directory structure is intact

### Authorization Issues
If authorization fails:
1. Check your `config.json` file has correct credentials
2. Verify network connectivity to SensorPush API
3. Check the log files for detailed error messages

### Data Pulling Issues
If data pulling doesn't work:
1. Ensure authorization is successful first
2. Check that sensors are properly configured
3. Verify the time interval is reasonable (not too frequent)
4. Check log files for API errors


