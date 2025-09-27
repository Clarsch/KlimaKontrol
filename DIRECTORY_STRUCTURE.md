# KlimaKontrol Directory Structure

## Base Directories
- `/opt/klimakontrol/` - Main application directory
  - `data/` - Data storage directory
  - `logs/` - Log files directory

## Service-Specific Directories

### klima-server
- **Logs**: `/opt/klimakontrol/logs/klima-server/`
  - `error.log`
  - `out.log` 
  - `combined.log`
- **Data**: `/opt/klimakontrol/data/klima-server/`
- **Environment Variables**:
  - `DATA_DIR=/opt/klimakontrol/data/klima-server`
  - `LOG_DIR=/opt/klimakontrol/logs/klima-server`

### klima-ngrok
- **Logs**: `/opt/klimakontrol/logs/klima-ngrok/`
  - `error.log`
  - `out.log`
  - `combined.log`

### data-provider
- **Logs**: `/opt/klimakontrol/logs/data-provider/`
  - `error.log`
  - `out.log`
  - `combined.log`
- **Data**: `/opt/klimakontrol/data/data-provider/`
- **Environment Variables**:
  - `DATA_DIR=/opt/klimakontrol/data/data-provider`
  - `LOG_DIR=/opt/klimakontrol/logs/data-provider`

## Setup Commands

Before starting the services, create the directory structure:

```bash
# Create base directories
sudo mkdir -p /opt/klimakontrol/data
sudo mkdir -p /opt/klimakontrol/logs

# Create service-specific directories
sudo mkdir -p /opt/klimakontrol/data/klima-server
sudo mkdir -p /opt/klimakontrol/data/data-provider
sudo mkdir -p /opt/klimakontrol/logs/klima-server
sudo mkdir -p /opt/klimakontrol/logs/klima-ngrok
sudo mkdir -p /opt/klimakontrol/logs/data-provider

# Set proper permissions (adjust user as needed)
sudo chown -R chris:chris /opt/klimakontrol/
sudo chmod -R 755 /opt/klimakontrol/
```
