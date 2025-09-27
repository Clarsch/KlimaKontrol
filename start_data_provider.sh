#!/bin/bash
# Data Provider Startup Script
# This script ensures the data-provider is properly set up before starting

set -e

echo "🚀 Starting Data Provider setup..."

# Navigate to data-provider directory
cd /home/chris/projects/KlimaKontrol/tools-submodule/data_provider

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Create directories
echo "📁 Creating directories..."
mkdir -p /opt/klimakontrol/data/data-provider
mkdir -p /opt/klimakontrol/logs/data-provider

# Setup configuration
echo "⚙️  Setting up configuration..."
if [ ! -f "config/config.json" ]; then
    if [ -f "config/config.example.json" ]; then
        cp config/config.example.json config/config.json
        echo "⚠️  Configuration file created from example. Please edit config/config.json with your settings."
    else
        echo "❌ No configuration example found. Please create config/config.json manually."
        exit 1
    fi
fi

# Setup external directories
echo "📁 Setting up external directories..."
python3 setup_external_dirs.py --base-dir /opt/klimakontrol --migrate || echo "⚠️  External directory setup had issues (this may be normal)"

# Initialize database
echo "🗄️  Initializing database..."
python main.py --init-db || echo "⚠️  Database initialization had issues (this may be normal)"

echo "✅ Data Provider setup completed!"

# Start the service
echo "🚀 Starting Data Provider service..."
exec python main.py
