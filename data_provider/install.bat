@echo off
REM Installation script for Data Provider Service (Windows)

echo Installing Data Provider Service...

REM Check if Python 3 is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python 3 is required but not installed.
    exit /b 1
)

REM Create virtual environment
echo Creating virtual environment...
python -m venv venv

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install requirements
echo Installing Python dependencies...
pip install -r requirements.txt

REM Create necessary directories
echo Creating directories...
if not exist "data" mkdir data
if not exist "logs" mkdir logs
if not exist "config" mkdir config

REM Copy example configuration if config doesn't exist
if not exist "config\config.json" (
    echo Creating configuration file...
    copy config\config.example.json config\config.json
    echo Please edit config\config.json with your settings before running the service.
)

REM Initialize database
echo Initializing database...
python main.py --init-db

echo Installation completed successfully!
echo.
echo Next steps:
echo 1. Edit config\config.json with your SensorPush credentials and server settings
echo 2. Test the service: python main.py --debug
echo 3. For production, use PM2: pm2 start ecosystem.config.js
echo.
echo Configuration file: config\config.json
echo Logs directory: logs\
echo Database file: data\sensor_data.db
