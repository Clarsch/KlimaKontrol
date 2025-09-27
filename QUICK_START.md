# KlimaKontrol Quick Start

## 🚀 One-Command Setup and Start

**Goal**: Run `pm2 start ecosystem.config.js` and everything is handled automatically.

## ✅ What You Get

The system will automatically:
- ✅ Create directory structure (`/opt/klimakontrol/`)
- ✅ Initialize git submodules
- ✅ Install Node.js dependencies
- ✅ Create Python virtual environment
- ✅ Install Python dependencies
- ✅ Set up data-provider configuration
- ✅ Initialize database
- ✅ Start all services with PM2

## 🎯 Usage

### Option 1: Master Startup Script (Recommended)
```bash
# Make executable and run
chmod +x start_klimakontrol.sh
./start_klimakontrol.sh
```

### Option 2: Manual Setup + PM2
```bash
# Run setup once
chmod +x setup_all.sh
./setup_all.sh

# Then start services
pm2 start ecosystem.config.js
```

### Option 3: Direct PM2 (if already set up)
```bash
pm2 start ecosystem.config.js
```

## 📁 Directory Structure Created

```
/opt/klimakontrol/
├── data/
│   ├── klima-server/
│   └── data-provider/
└── logs/
    ├── klima-server/
    ├── klima-ngrok/
    └── data-provider/
```

## 🔧 Services Started

1. **klima-server** - Node.js API server
2. **klima-ngrok** - Tunnel service
3. **data-provider** - Python data collection service

## 📊 Monitoring

```bash
# Check status
pm2 status

# View logs
pm2 logs

# View specific service logs
pm2 logs data-provider
pm2 logs klima-server
pm2 logs klima-ngrok

# Restart services
pm2 restart all
pm2 restart data-provider
```

## ⚙️ Configuration

After first run, edit the data-provider configuration:
```bash
nano tools-submodule/data_provider/config/config.json
```

Add your SensorPush credentials and server settings.

## 🆘 Troubleshooting

### If setup fails:
```bash
# Check logs
pm2 logs

# Manual setup
./setup_all.sh

# Check permissions
ls -la /opt/klimakontrol/
```

### If services won't start:
```bash
# Check status
pm2 status

# View error logs
pm2 logs --err

# Restart specific service
pm2 restart data-provider
```

## 🎉 Success!

Once running, you should see:
- ✅ All 3 services running in PM2
- ✅ Logs being written to `/opt/klimakontrol/logs/`
- ✅ Data being stored in `/opt/klimakontrol/data/`

**The goal is achieved**: `pm2 start ecosystem.config.js` handles everything!
