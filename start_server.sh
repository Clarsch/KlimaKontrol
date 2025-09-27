#!/bin/bash
# Server Startup Script for PM2
# This script ensures the server dependencies are installed before starting

set -e

echo "🚀 Starting KlimaKontrol Server..."

# Navigate to server directory
cd /home/chris/projects/KlimaKontrol/server

# Create directories
mkdir -p /opt/klimakontrol/data/klima-server
mkdir -p /opt/klimakontrol/logs/klima-server

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing server dependencies..."
    npm install
    echo "✅ Server dependencies installed"
else
    echo "✅ Server dependencies already installed"
fi

# Start the server
echo "🚀 Starting server..."
exec npm run start
