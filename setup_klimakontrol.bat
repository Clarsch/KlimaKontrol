@echo off
REM KlimaKontrol Setup Script for Windows
REM This script prepares the system for running KlimaKontrol services

echo 🚀 Setting up KlimaKontrol services...

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Running as administrator
) else (
    echo ⚠️  Not running as administrator. You may need admin rights for some operations.
)

REM Create base directories (Windows equivalent of /opt/klimakontrol)
echo 📁 Creating directory structure...
if not exist "C:\klimakontrol" mkdir "C:\klimakontrol"
if not exist "C:\klimakontrol\data" mkdir "C:\klimakontrol\data"
if not exist "C:\klimakontrol\logs" mkdir "C:\klimakontrol\logs"
if not exist "C:\klimakontrol\data\klima-server" mkdir "C:\klimakontrol\data\klima-server"
if not exist "C:\klimakontrol\data\data-provider" mkdir "C:\klimakontrol\data\data-provider"
if not exist "C:\klimakontrol\logs\klima-server" mkdir "C:\klimakontrol\logs\klima-server"
if not exist "C:\klimakontrol\logs\klima-ngrok" mkdir "C:\klimakontrol\logs\klima-ngrok"
if not exist "C:\klimakontrol\logs\data-provider" mkdir "C:\klimakontrol\logs\data-provider"

echo ✅ Directory structure created

REM Check if submodule exists and is populated
echo 🔍 Checking submodule...
if not exist "tools-submodule\data_provider" (
    echo ⚠️  Submodule not found. Initializing...
    git submodule update --init --recursive
    echo ✅ Submodule initialized
) else (
    echo ✅ Submodule already exists
)

REM Check if Python 3 is available
echo 🐍 Checking Python 3...
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Python 3 is required but not installed.
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo ✅ Python %PYTHON_VERSION% found

REM Check if Node.js is available
echo 📦 Checking Node.js...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Node.js is required but not installed.
    exit /b 1
)

for /f %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% found

REM Check if npm is available
npm --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ npm is required but not installed.
    exit /b 1
)

REM Install server dependencies
echo 📦 Installing server dependencies...
cd server
if not exist "node_modules" (
    npm install
    echo ✅ Server dependencies installed
) else (
    echo ✅ Server dependencies already installed
)
cd ..

REM Check if data-provider has virtual environment
echo 🐍 Setting up data-provider Python environment...
cd tools-submodule\data_provider

if not exist "venv" (
    echo ⚠️  Creating Python virtual environment...
    python -m venv venv
    echo ✅ Virtual environment created
)

REM Activate virtual environment and install dependencies
echo 📦 Installing Python dependencies...
call venv\Scripts\activate.bat
pip install --upgrade pip
pip install -r requirements.txt
echo ✅ Python dependencies installed

REM Setup configuration
echo ⚙️  Setting up configuration...
if not exist "config\config.json" (
    if exist "config\config.example.json" (
        copy "config\config.example.json" "config\config.json"
        echo ⚠️  Configuration file created from example. Please edit config\config.json with your settings.
    ) else (
        echo ❌ No configuration example found. Please create config\config.json manually.
    )
) else (
    echo ✅ Configuration file already exists
)

REM Setup external directories
echo 📁 Setting up external directories...
python setup_external_dirs.py --base-dir C:\klimakontrol --migrate || echo ⚠️  External directory setup had issues (this may be normal)

REM Initialize database
echo 🗄️  Initializing database...
python main.py --init-db || echo ⚠️  Database initialization had issues (this may be normal)

call venv\Scripts\deactivate.bat
cd ..\..

echo ✅ Data-provider setup completed

REM Check if ngrok is available
echo 🌐 Checking ngrok...
ngrok version >nul 2>&1
if %errorLevel% neq 0 (
    echo ⚠️  ngrok not found. Please install ngrok for the tunnel service.
    echo ⚠️  Visit: https://ngrok.com/download
) else (
    echo ✅ ngrok found
)

echo.
echo 🎉 KlimaKontrol setup completed!
echo.
echo 📋 Next steps:
echo 1. Edit tools-submodule\data_provider\config\config.json with your SensorPush credentials
echo 2. Edit server configuration if needed
echo 3. Start services with: pm2 start ecosystem.config.js
echo 4. Check status with: pm2 status
echo 5. View logs with: pm2 logs
echo.
echo 📁 Directory structure:
echo    C:\klimakontrol\data\klima-server\
echo    C:\klimakontrol\data\data-provider\
echo    C:\klimakontrol\logs\klima-server\
echo    C:\klimakontrol\logs\klima-ngrok\
echo    C:\klimakontrol\logs\data-provider\
echo.
echo 🔧 Troubleshooting:
echo    - Check permissions: dir C:\klimakontrol\
echo    - Check submodule: git submodule status
echo    - Check Python venv: dir tools-submodule\data_provider\venv\
echo    - Test data-provider: cd tools-submodule\data_provider ^&^& venv\Scripts\activate ^&^& python main.py --help

pause
