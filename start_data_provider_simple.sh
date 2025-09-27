#!/bin/bash
# Simple Data Provider Startup Script for PM2

# Create directories with proper permissions
sudo mkdir -p /opt/klimakontrol/data/data-provider
sudo mkdir -p /opt/klimakontrol/logs/data-provider
sudo chown -R $USER:$USER /opt/klimakontrol/
sudo chmod -R 755 /opt/klimakontrol/data/
sudo chmod -R 777 /opt/klimakontrol/logs/

# Navigate to data-provider directory
cd /home/chris/projects/KlimaKontrol/tools-submodule/data_provider

# Activate virtual environment and start
source venv/bin/activate
exec python main.py
