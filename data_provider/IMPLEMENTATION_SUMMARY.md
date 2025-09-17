# Data Provider Service - Implementation Summary

## Overview

The **data_provider** service is a complete Python-based solution for fetching sensor data from SensorPush API and uploading it to a local KlimaKontrol server. It's designed to run on Raspberry Pi with PM2 process management and includes comprehensive data persistence, error handling, and monitoring capabilities.

## Key Features Implemented

### ✅ Complete Service Architecture
- **Modular Design**: Separated concerns into dedicated modules
- **Database Integration**: SQLite database with SQLAlchemy ORM
- **Configuration Management**: Pydantic-based configuration with validation
- **Comprehensive Logging**: Multi-level logging with file rotation
- **Error Handling**: Robust error recovery and retry mechanisms

### ✅ Database Schema
- **Sensors Table**: Sensor configuration and metadata
- **Gateways Table**: Gateway information and status
- **Sensor State Table**: Per-sensor timestamps and status tracking
- **Sensor Readings Table**: Actual sensor data with upload tracking
- **Upload Log Table**: Upload operation history
- **Service State Table**: Global service state management

### ✅ API Integration
- **SensorPush Client**: OAuth2 authentication and data fetching
- **Server Uploader**: Local server integration with batch uploads
- **Data Converter**: Unit conversion (Fahrenheit→Celsius, inHg→hPa)
- **Rate Limiting**: Configurable API rate limiting

### ✅ Data Management
- **Incremental Fetching**: Only fetches new data since last successful upload
- **Batch Processing**: Groups sensors for efficient API usage
- **Data Validation**: Validates readings before storage
- **Retention Policies**: Configurable data cleanup and retention

### ✅ Service Management
- **PM2 Integration**: Production-ready process management
- **Signal Handling**: Graceful shutdown on SIGINT/SIGTERM
- **State Persistence**: Service state backup and restoration
- **Health Monitoring**: Connection testing and status reporting

## File Structure

```
data_provider/
├── main.py                     # Service entry point
├── README.md                   # Comprehensive documentation
├── requirements.txt            # Python dependencies
├── setup.py                    # Package installation
├── install.sh                  # Linux/macOS installation script
├── install.bat                 # Windows installation script
├── ecosystem.config.js         # PM2 configuration
├── config/
│   ├── config.json            # Main configuration (with your credentials)
│   ├── config.example.json    # Example configuration
│   └── config_loader.py       # Configuration management
├── database/
│   ├── models.py              # SQLAlchemy database models
│   ├── connection.py          # Database connection management
│   └── migrations/            # Database schema migrations
├── src/
│   ├── sensorpush_client.py   # SensorPush API client
│   ├── data_converter.py      # Data format conversion
│   ├── server_uploader.py     # Local server upload client
│   ├── database_manager.py    # Database operations
│   ├── state_manager.py       # Service state management
│   ├── cleanup_manager.py     # Data cleanup and retention
│   └── logger.py              # Logging configuration
├── data/                      # Data directory (created at runtime)
│   └── sensor_data.db         # SQLite database file
└── logs/                      # Log directory (created at runtime)
    ├── data_provider.log      # Main service log
    ├── error.log              # Error log
    └── debug.log              # Debug log
```

## Configuration

The service uses a comprehensive JSON configuration file with the following sections:

- **Database**: SQLite settings, backup configuration
- **SensorPush**: API credentials and request limits
- **Server**: Local server endpoints and authentication
- **Service**: Operation frequency, batch sizes, retry settings
- **Sensors**: Sensor ID mapping and auto-discovery
- **Data Conversion**: Unit conversion settings
- **Data Retention**: Cleanup policies and schedules
- **Logging**: Log levels, file rotation, output settings

## Installation & Usage

### Quick Start
```bash
# Linux/macOS
./install.sh

# Windows
install.bat

# Manual installation
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py --init-db
```

### Configuration
1. Edit `config/config.json` with your SensorPush credentials
2. Update server URL and JWT token
3. Configure sensor mappings and locations

### Running the Service
```bash
# Development
python main.py --debug

# Production with PM2
pm2 start ecosystem.config.js
pm2 status
pm2 logs data-provider
```

## Key Capabilities

### Data Flow
1. **Fetch**: Get new readings from SensorPush API (per-sensor timestamps)
2. **Convert**: Transform data to server format with unit conversion
3. **Store**: Save readings to local SQLite database
4. **Upload**: Send data to local KlimaKontrol server in batches
5. **Track**: Mark readings as uploaded and update timestamps
6. **Cleanup**: Remove old data based on retention policies

### Monitoring & Maintenance
- **Comprehensive Logging**: Multi-level logs with rotation
- **Database Statistics**: Track readings, uploads, and performance
- **Health Checks**: Connection testing and status reporting
- **Automatic Cleanup**: Configurable data retention and cleanup
- **Backup Management**: Database backups before cleanup operations

### Error Handling
- **Retry Logic**: Exponential backoff for failed operations
- **Graceful Degradation**: Continue operation despite individual failures
- **State Recovery**: Restore service state after restarts
- **Error Tracking**: Log and track error patterns

## Production Readiness

The service is production-ready with:
- **PM2 Integration**: Process management and auto-restart
- **Resource Management**: Memory limits and monitoring
- **Log Management**: Structured logging with rotation
- **Database Optimization**: Indexes, vacuum, and performance tuning
- **Security**: Credential management and secure connections
- **Monitoring**: Health checks and performance metrics

## Next Steps

1. **Deploy**: Copy the `data_provider` folder to your Raspberry Pi
2. **Configure**: Update `config/config.json` with your settings
3. **Install**: Run the installation script
4. **Test**: Run in debug mode to verify operation
5. **Deploy**: Start with PM2 for production use
6. **Monitor**: Check logs and database statistics

The service is designed to be self-contained and can be easily extracted to a separate repository for deployment.
