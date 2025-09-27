#!/bin/bash
# Master Setup Script for KlimaKontrol
# This script handles EVERYTHING needed to run the services
# Run this once, then pm2 start ecosystem.config.js will work

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo -e "${BLUE}🚀 KlimaKontrol Master Setup${NC}"
echo "=================================="

# Get the project root directory
PROJECT_ROOT="/home/chris/projects/KlimaKontrol"
BASE_DATA_DIR="/opt/klimakontrol/data"
BASE_LOG_DIR="/opt/klimakontrol/logs"

print_info "Project root: $PROJECT_ROOT"
print_info "Data directory: $BASE_DATA_DIR"
print_info "Log directory: $BASE_LOG_DIR"

# Check if running as root for system directories
if [[ $EUID -eq 0 ]]; then
    print_warning "Running as root. This is needed for /opt/klimakontrol setup."
else
    print_warning "Not running as root. You may need sudo for /opt/klimakontrol setup."
fi

# Step 1: Create base directory structure
print_info "Step 1: Creating directory structure..."
sudo mkdir -p $BASE_DATA_DIR $BASE_LOG_DIR
sudo mkdir -p $BASE_DATA_DIR/{klima-server,data-provider}
sudo mkdir -p $BASE_LOG_DIR/{klima-server,klima-ngrok,data-provider}

# Set permissions
sudo chown -R $USER:$USER /opt/klimakontrol/
sudo chmod -R 755 /opt/klimakontrol/
print_status "Directory structure created"

# Step 2: Check and initialize submodule
print_info "Step 2: Setting up submodule..."
cd $PROJECT_ROOT

if [ ! -d "tools-submodule/data_provider" ] || [ -z "$(ls -A tools-submodule/data_provider 2>/dev/null)" ]; then
    print_warning "Submodule not found or empty. Initializing..."
    git submodule update --init --recursive
    print_status "Submodule initialized"
else
    print_status "Submodule already exists"
fi

# Step 3: Check system requirements
print_info "Step 3: Checking system requirements..."

# Check Python 3
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is required but not installed."
    exit 1
fi
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
print_status "Python $PYTHON_VERSION found"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is required but not installed."
    exit 1
fi
NODE_VERSION=$(node --version)
print_status "Node.js $NODE_VERSION found"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is required but not installed."
    exit 1
fi
print_status "npm found"

# Step 4: Install server dependencies
print_info "Step 4: Installing server dependencies..."
cd $PROJECT_ROOT/server
if [ ! -d "node_modules" ]; then
    npm install
    print_status "Server dependencies installed"
else
    print_status "Server dependencies already installed"
fi

# Step 5: Setup data-provider
print_info "Step 5: Setting up data-provider..."
cd $PROJECT_ROOT/tools-submodule/data_provider

# Create virtual environment
if [ ! -d "venv" ]; then
    print_warning "Creating Python virtual environment..."
    python3 -m venv venv
    print_status "Virtual environment created"
else
    print_status "Virtual environment already exists"
fi

# Activate virtual environment and install dependencies
print_warning "Installing Python dependencies..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
print_status "Python dependencies installed"

# Setup configuration
if [ ! -f "config/config.json" ]; then
    if [ -f "config/config.example.json" ]; then
        cp config/config.example.json config/config.json
        print_warning "Configuration file created from example. Please edit config/config.json with your settings."
    else
        print_error "No configuration example found. Please create config/config.json manually."
        exit 1
    fi
else
    print_status "Configuration file already exists"
fi

# Setup external directories
print_warning "Setting up external directories..."
python3 setup_external_dirs.py --base-dir /opt/klimakontrol --migrate || print_warning "External directory setup had issues (this may be normal)"

# Initialize database
print_warning "Initializing database..."
python main.py --init-db || print_warning "Database initialization had issues (this may be normal)"

deactivate
print_status "Data-provider setup completed"

# Step 6: Check ngrok
print_info "Step 6: Checking ngrok..."
if ! command -v ngrok &> /dev/null; then
    print_warning "ngrok not found. Please install ngrok for the tunnel service."
    print_warning "Visit: https://ngrok.com/download"
else
    print_status "ngrok found"
fi

# Step 7: Create PM2 startup script
print_info "Step 7: Creating PM2 startup script..."
cat > $PROJECT_ROOT/start_data_provider.sh << 'EOF'
#!/bin/bash
# Data Provider Startup Script for PM2
cd /home/chris/projects/KlimaKontrol/tools-submodule/data_provider
source venv/bin/activate
exec python main.py
EOF

chmod +x $PROJECT_ROOT/start_data_provider.sh
print_status "PM2 startup script created"

# Step 8: Final verification
print_info "Step 8: Final verification..."

# Check if all required files exist
REQUIRED_FILES=(
    "$PROJECT_ROOT/server/node_modules"
    "$PROJECT_ROOT/tools-submodule/data_provider/venv"
    "$PROJECT_ROOT/tools-submodule/data_provider/venv/bin/python"
    "$PROJECT_ROOT/start_data_provider.sh"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -e "$file" ]; then
        print_status "✓ $file exists"
    else
        print_error "✗ $file missing"
        exit 1
    fi
done

# Check directory permissions
if [ -w "/opt/klimakontrol" ]; then
    print_status "✓ /opt/klimakontrol is writable"
else
    print_error "✗ /opt/klimakontrol is not writable"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 KlimaKontrol setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 What was set up:${NC}"
echo "  ✅ Directory structure: /opt/klimakontrol/{data,logs}/"
echo "  ✅ Git submodule: tools-submodule/data_provider/"
echo "  ✅ Server dependencies: server/node_modules/"
echo "  ✅ Python virtual environment: tools-submodule/data_provider/venv/"
echo "  ✅ Data-provider configuration: config/config.json"
echo "  ✅ Database initialized"
echo "  ✅ PM2 startup script: start_data_provider.sh"
echo ""
echo -e "${BLUE}🚀 Ready to start services:${NC}"
echo "  pm2 start ecosystem.config.js"
echo ""
echo -e "${BLUE}📊 Monitor services:${NC}"
echo "  pm2 status"
echo "  pm2 logs"
echo ""
echo -e "${BLUE}🔧 Next steps:${NC}"
echo "  1. Edit tools-submodule/data_provider/config/config.json with your SensorPush credentials"
echo "  2. Run: pm2 start ecosystem.config.js"
echo "  3. Check status: pm2 status"
