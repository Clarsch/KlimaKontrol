# KlimaKontrol Log Management Tools

This directory contains tools for managing logs across the entire KlimaKontrol system.

## 📁 Files

- `clear_all_logs.sh` - Simple script to clear all logs
- `clear_all_logs.bat` - Windows version of the clear script
- `log_manager.sh` - Comprehensive log management tool

## 🚀 Quick Start

### Clear All Logs (Linux)
```bash
# Make executable and run
chmod +x clear_all_logs.sh
./clear_all_logs.sh

# Or force clear without confirmation
./clear_all_logs.sh --force
```

### Clear All Logs (Windows)
```cmd
clear_all_logs.bat
```

### Comprehensive Log Management (Linux)
```bash
# Make executable
chmod +x log_manager.sh

# Show help
./log_manager.sh --help

# Show log status
./log_manager.sh status

# Clear all logs
./log_manager.sh clear

# Monitor logs in real-time
./log_manager.sh monitor

# Tail specific service logs
./log_manager.sh tail klima-server
./log_manager.sh tail data-provider

# Search for text in logs
./log_manager.sh search "error"
./log_manager.sh search "connection failed"

# Rotate logs (backup and clear)
./log_manager.sh rotate
```

## 📊 What Gets Cleared

The scripts clear logs from these locations:

### PM2 Logs
- `~/.pm2/logs/` - PM2 process logs
- Uses `pm2 flush` command when available

### KlimaKontrol Application Logs
- `/opt/klimakontrol/logs/` - Main application logs
  - `klima-server/` - Server logs
  - `klima-ngrok/` - Tunnel logs
  - `data-provider/` - Data provider logs

### Project Logs
- `/home/chris/projects/KlimaKontrol/logs/` - Project-specific logs

### Data Provider Logs
- `/home/chris/projects/KlimaKontrol/tools-submodule/data_provider/logs/` - Data provider internal logs

## 🔧 Features

### clear_all_logs.sh
- ✅ Clears all log files across the system
- ✅ Shows log sizes before clearing
- ✅ Confirmation prompt (can be skipped with `--force`)
- ✅ Dry-run mode (`--dry-run`)
- ✅ Restarts PM2 processes after clearing

### log_manager.sh
- ✅ **Status** - Show current log status and sizes
- ✅ **Clear** - Clear all logs with confirmation
- ✅ **Monitor** - Real-time log monitoring
- ✅ **Tail** - Tail specific service logs
- ✅ **Search** - Search for text across all logs
- ✅ **Rotate** - Backup and clear logs
- ✅ **Archive** - Create timestamped backups

## 🎯 Usage Examples

### Daily Log Maintenance
```bash
# Check log status
./log_manager.sh status

# Clear logs if they're getting large
./log_manager.sh clear

# Or rotate them to keep backups
./log_manager.sh rotate
```

### Debugging Issues
```bash
# Monitor all logs in real-time
./log_manager.sh monitor

# Search for specific errors
./log_manager.sh search "connection refused"
./log_manager.sh search "permission denied"

# Tail specific service
./log_manager.sh tail data-provider
```

### System Maintenance
```bash
# Force clear without confirmation
./log_manager.sh clear --force

# Create backup before clearing
./log_manager.sh rotate
```

## ⚠️ Important Notes

- **Backup First**: Use `rotate` command to create backups before clearing
- **PM2 Restart**: Logs are cleared, but PM2 processes continue running
- **Permissions**: May require sudo for `/opt/klimakontrol/` directories
- **Dry Run**: Use `--dry-run` to see what would be cleared without actually clearing

## 🔍 Troubleshooting

### Permission Issues
```bash
# Fix permissions
sudo chown -R chris:chris /opt/klimakontrol/
sudo chmod -R 755 /opt/klimakontrol/
```

### PM2 Issues
```bash
# Check PM2 status
pm2 status

# Restart PM2 after clearing logs
pm2 restart all
```

### Large Log Files
```bash
# Check what's using space
du -sh /opt/klimakontrol/logs/*
du -sh ~/.pm2/logs/*

# Clear specific directories
rm -rf /opt/klimakontrol/logs/klima-server/*
```
