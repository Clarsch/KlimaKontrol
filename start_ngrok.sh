#!/bin/bash
# Ngrok Startup Script for PM2
# This script ensures ngrok is available before starting

set -e

echo "🚀 Starting KlimaKontrol Ngrok..."

# Create directories with proper permissions
sudo mkdir -p /opt/klimakontrol/logs/klima-ngrok
sudo chown -R $USER:$USER /opt/klimakontrol/
sudo chmod -R 777 /opt/klimakontrol/logs/

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed. Please install ngrok first."
    echo "Visit: https://ngrok.com/download"
    exit 1
fi

echo "✅ ngrok found"

# Start ngrok
echo "🚀 Starting ngrok tunnel..."
exec ngrok http --domain=possible-key-bluebird.ngrok-free.app 5001
