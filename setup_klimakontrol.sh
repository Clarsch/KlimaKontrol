#!/bin/bash
# KlimaKontrol Setup Script
# This script prepares the system for running KlimaKontrol services

set -e

echo "🚀 Setting up KlimaKontrol services..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root for system directories
if [[ $EUID -eq 0 ]]; then
    print_warning "Running as root. This is needed for /opt/klimakontrol setup."
else
    print_warning "Not running as root. You may need sudo for /opt/klimakontrol setup."
fi

# Create base directories
echo "📁 Creating directory structure..."
BASE_DATA_DIR="/opt/klimakontrol/data"
BASE_LOG_DIR="/opt/klimakontrol/logs"

sudo mkdir -p $BASE_DATA_DIR $BASE_LOG_DIR
sudo mkdir -p $BASE_DATA_DIR/{klima-server,data-provider}
sudo mkdir -p $BASE_LOG_DIR/{klima-server,klima-ngrok,data-provider}

# Set permissions
echo "🔐 Setting permissions..."
sudo chown -R $USER:$USER /opt/klimakontrol/
sudo chmod -R 755 /opt/klimakontrol/

print_status "Directory structure created"

# Check if submodule exists and is populated
echo "🔍 Checking submodule..."
if [ ! -d "tools-submodule/data_provider" ] || [ -z "$(ls -A tools-submodule/data_provider 2>/dev/null)" ]; then
    print_warning "Submodule not found or empty. Initializing..."
    git submodule update --init --recursive
    print_status "Submodule initialized"
else
    print_status "Submodule already exists"
fi

# Check if Python 3 is available
echo "🐍 Checking Python 3..."
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is required but not installed."
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
print_status "Python $PYTHON_VERSION found"

# Check if Node.js is available
echo "📦 Checking Node.js..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is required but not installed."
    exit 1
fi

NODE_VERSION=$(node --version)
print_status "Node.js $NODE_VERSION found"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    print_error "npm is required but not installed."
    exit 1
fi

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
if [ ! -d "node_modules" ]; then
    npm install
    print_status "Server dependencies installed"
else
    print_status "Server dependencies already installed"
fi
cd ..

# Check if data-provider has virtual environment
echo "🐍 Setting up data-provider Python environment..."
cd tools-submodule/data_provider

if [ ! -d "venv" ]; then
    print_warning "Creating Python virtual environment..."
    python3 -m venv venv
    print_status "Virtual environment created"
fi

# Activate virtual environment and install dependencies
echo "📦 Installing Python dependencies..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
print_status "Python dependencies installed"

# Setup configuration
echo "⚙️  Setting up configuration..."
if [ ! -f "config/config.json" ]; then
    if [ -f "config/config.example.json" ]; then
        cp config/config.example.json config/config.json
        print_warning "Configuration file created from example. Please edit config/config.json with your settings."
    else
        print_error "No configuration example found. Please create config/config.json manually."
    fi
else
    print_status "Configuration file already exists"
fi

# Setup external directories
echo "📁 Setting up external directories..."
python3 setup_external_dirs.py --base-dir /opt/klimakontrol --migrate || print_warning "External directory setup had issues (this may be normal)"

# Initialize database
echo "🗄️  Initializing database..."
python main.py --init-db || print_warning "Database initialization had issues (this may be normal)"

deactivate
cd ../..

print_status "Data-provider setup completed"

# Check if ngrok is available
echo "🌐 Checking ngrok..."
if ! command -v ngrok &> /dev/null; then
    print_warning "ngrok not found. Please install ngrok for the tunnel service."
    print_warning "Visit: https://ngrok.com/download"
else
    print_status "ngrok found"
fi

echo ""
echo "🎉 KlimaKontrol setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Edit tools-submodule/data_provider/config/config.json with your SensorPush credentials"
echo "2. Edit server configuration if needed"
echo "3. Start services with: pm2 start ecosystem.config.js"
echo "4. Check status with: pm2 status"
echo "5. View logs with: pm2 logs"
echo ""
echo "📁 Directory structure:"
echo "   /opt/klimakontrol/data/klima-server/"
echo "   /opt/klimakontrol/data/data-provider/"
echo "   /opt/klimakontrol/logs/klima-server/"
echo "   /opt/klimakontrol/logs/klima-ngrok/"
echo "   /opt/klimakontrol/logs/data-provider/"
echo ""
echo "🔧 Troubleshooting:"
echo "   - Check permissions: ls -la /opt/klimakontrol/"
echo "   - Check submodule: git submodule status"
echo "   - Check Python venv: ls -la tools-submodule/data_provider/venv/"
echo "   - Test data-provider: cd tools-submodule/data_provider && source venv/bin/activate && python main.py --help"
