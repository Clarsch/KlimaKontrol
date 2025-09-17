# Data Provider Service

A Python-based service for fetching sensor data from SensorPush API and uploading it to a local KlimaKontrol server. Designed to run on Raspberry Pi with PM2 process management.

## Features

- **Incremental Data Fetching**: Only fetches new data since last successful upload per sensor
- **Batch Processing**: Groups multiple sensors for efficient API usage
- **Local Database Storage**: SQLite database for data persistence and reliability
- **Automatic Token Management**: Handles SensorPush OAuth2 token refresh
- **Comprehensive Logging**: Multi-level logging with file rotation
- **Data Cleanup**: Configurable retention policies for database maintenance
- **Error Recovery**: Retry logic with exponential backoff
- **PM2 Integration**: Ready for production deployment

## Architecture

```
data_provider/
├── main.py                 # Service entry point
├── config/
│   ├── config.json        # Main configuration file
│   └── config_loader.py   # Configuration management
├── database/
│   ├── __init__.py
│   ├── models.py          # SQLAlchemy database models
│   ├── connection.py      # Database connection management
│   └── migrations/        # Database schema migrations
├── src/
│   ├── __init__.py
│   ├── sensorpush_client.py    # SensorPush API client
│   ├── data_converter.py       # Data format conversion
│   ├── server_uploader.py      # Local server upload client
│   ├── database_manager.py     # Database operations
│   ├── state_manager.py        # Service state management
│   ├── cleanup_manager.py      # Data cleanup and retention
│   └── logger.py               # Logging configuration
├── data/
│   ├── sensor_data.db     # SQLite database file
│   └── service_state.json # Backup state file
├── logs/
│   ├── data_provider.log  # Main service log
│   ├── error.log          # Error log
│   └── debug.log          # Debug log
├── requirements.txt       # Python dependencies
├── ecosystem.config.js    # PM2 configuration
└── setup.py              # Installation script
```

## Installation

1. **Clone and Setup**:
   ```bash
   cd data_provider
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure**:
   ```bash
   cp config/config.example.json config/config.json
   # Edit config/config.json with your settings
   ```

3. **Initialize Database**:
   ```bash
   python main.py --init-db
   ```

4. **Run Service**:
   ```bash
   # Development
   python main.py
   
   # Production with PM2
   pm2 start ecosystem.config.js
   ```

## Configuration

See `config/config.example.json` for complete configuration options.

### Key Settings

- **SensorPush API**: Email/password credentials and API limits
- **Local Server**: Server URL, endpoints, and authentication
- **Service**: Fetch frequency, batch sizes, retry settings
- **Database**: Retention policies and cleanup schedules
- **Sensors**: Mapping between SensorPush IDs and local sensor IDs

## Database Schema

### Tables

- **sensors**: Sensor configuration and metadata
- **gateways**: Gateway information and status
- **sensor_state**: Per-sensor timestamps and status
- **sensor_readings**: Actual sensor data readings
- **upload_log**: Upload operation history

### Data Flow

1. **Fetch**: Get new readings from SensorPush API
2. **Store**: Save readings to local SQLite database
3. **Convert**: Transform data to server format
4. **Upload**: Send data to local KlimaKontrol server
5. **Update**: Mark readings as uploaded in database
6. **Cleanup**: Remove old data based on retention policy

## Monitoring

### Logs

- **data_provider.log**: Main service operations
- **error.log**: Errors and exceptions
- **debug.log**: Detailed debugging information

### Metrics

- Database size and record counts
- Upload success/failure rates
- API response times
- Service uptime and health

## Maintenance

### Database Cleanup

The service automatically manages data retention:

- **Sensor Readings**: Configurable retention (default: 1 year)
- **Upload Logs**: Configurable retention (default: 3 months)
- **Error Logs**: Configurable retention (default: 1 month)

### Backup

- Database backups created before cleanup operations
- Service state backed up to JSON file
- Log rotation with configurable retention

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Check SensorPush credentials
2. **Database Locked**: Ensure only one service instance running
3. **Upload Failures**: Verify local server is running and accessible
4. **Memory Issues**: Adjust batch sizes in configuration

### Debug Mode

```bash
python main.py --debug --log-level DEBUG
```

## Development

### Adding New Features

1. Update database models in `database/models.py`
2. Create migration in `database/migrations/`
3. Implement business logic in `src/`
4. Update configuration schema
5. Add tests and documentation

### Testing

```bash
# Run tests
python -m pytest tests/

# Run with coverage
python -m pytest --cov=src tests/
```

## License

Part of the KlimaKontrol project.
