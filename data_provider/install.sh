#!/bin/bash
# Installation script for Data Provider Service

set -e

echo "Installing Data Provider Service..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not installed."
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
REQUIRED_VERSION="3.8"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "Error: Python $REQUIRED_VERSION or higher is required. Found: $PYTHON_VERSION"
    exit 1
fi

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Create necessary directories
echo "Creating directories..."
mkdir -p data logs config

# Copy example configuration if config doesn't exist
if [ ! -f "config/config.json" ]; then
    echo "Creating configuration file..."
    cp config/config.example.json config/config.json
    echo "Please edit config/config.json with your settings before running the service."
fi

# Make main script executable
chmod +x main.py

# Initialize database
echo "Initializing database..."
python main.py --init-db

echo "Installation completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit config/config.json with your SensorPush credentials and server settings"
echo "2. Test the service: python main.py --debug"
echo "3. For production, use PM2: pm2 start ecosystem.config.js"
echo ""
echo "Configuration file: config/config.json"
echo "Logs directory: logs/"
echo "Database file: data/sensor_data.db"
