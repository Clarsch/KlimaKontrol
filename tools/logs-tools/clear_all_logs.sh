#!/bin/bash
# KlimaKontrol Log Clearing Script
# This script clears all logs including PM2 logs and KlimaKontrol application logs

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

echo -e "${BLUE}🧹 KlimaKontrol Log Clearing Tool${NC}"
echo "====================================="

# Configuration
PM2_LOGS_DIR="$HOME/.pm2/logs"
KLIMAKONTROL_LOGS_DIR="/opt/klimakontrol/logs"
PROJECT_LOGS_DIR="/home/chris/projects/KlimaKontrol/logs"
DATA_PROVIDER_LOGS_DIR="/home/chris/projects/KlimaKontrol/tools-submodule/data_provider/logs"

# Function to clear directory logs
clear_directory_logs() {
    local dir_path="$1"
    local dir_name="$2"
    
    if [ -d "$dir_path" ]; then
        print_info "Clearing $dir_name logs in: $dir_path"
        
        # Count files before clearing
        local file_count=$(find "$dir_path" -type f \( -name "*.log" -o -name "*.out" -o -name "*.err" \) 2>/dev/null | wc -l)
        
        if [ "$file_count" -gt 0 ]; then
            # Clear log files
            find "$dir_path" -type f \( -name "*.log" -o -name "*.out" -o -name "*.err" \) -delete 2>/dev/null
            print_status "Cleared $file_count log files from $dir_name"
        else
            print_warning "No log files found in $dir_name"
        fi
    else
        print_warning "$dir_name directory does not exist: $dir_path"
    fi
}

# Function to clear PM2 logs
clear_pm2_logs() {
    print_info "Clearing PM2 logs..."
    
    if command -v pm2 &> /dev/null; then
        # Clear PM2 logs using PM2 command
        pm2 flush 2>/dev/null || print_warning "PM2 flush command failed"
        print_status "PM2 logs flushed"
        
        # Also clear PM2 log files directly
        if [ -d "$PM2_LOGS_DIR" ]; then
            local pm2_file_count=$(find "$PM2_LOGS_DIR" -type f \( -name "*.log" -o -name "*.out" -o -name "*.err" \) 2>/dev/null | wc -l)
            if [ "$pm2_file_count" -gt 0 ]; then
                find "$PM2_LOGS_DIR" -type f \( -name "*.log" -o -name "*.out" -o -name "*.err" \) -delete 2>/dev/null
                print_status "Cleared $pm2_file_count PM2 log files"
            fi
        fi
    else
        print_warning "PM2 not found, skipping PM2 log clearing"
    fi
}

# Function to show log sizes before clearing
show_log_sizes() {
    print_info "Current log sizes:"
    
    local total_size=0
    
    # PM2 logs
    if [ -d "$PM2_LOGS_DIR" ]; then
        local pm2_size=$(du -sh "$PM2_LOGS_DIR" 2>/dev/null | cut -f1)
        echo "  PM2 logs: $pm2_size"
        total_size=$(du -sb "$PM2_LOGS_DIR" 2>/dev/null | cut -f1)
    fi
    
    # KlimaKontrol logs
    if [ -d "$KLIMAKONTROL_LOGS_DIR" ]; then
        local kk_size=$(du -sh "$KLIMAKONTROL_LOGS_DIR" 2>/dev/null | cut -f1)
        echo "  KlimaKontrol logs: $kk_size"
        local kk_bytes=$(du -sb "$KLIMAKONTROL_LOGS_DIR" 2>/dev/null | cut -f1)
        total_size=$((total_size + kk_bytes))
    fi
    
    # Project logs
    if [ -d "$PROJECT_LOGS_DIR" ]; then
        local proj_size=$(du -sh "$PROJECT_LOGS_DIR" 2>/dev/null | cut -f1)
        echo "  Project logs: $proj_size"
        local proj_bytes=$(du -sb "$PROJECT_LOGS_DIR" 2>/dev/null | cut -f1)
        total_size=$((total_size + proj_bytes))
    fi
    
    # Data provider logs
    if [ -d "$DATA_PROVIDER_LOGS_DIR" ]; then
        local dp_size=$(du -sh "$DATA_PROVIDER_LOGS_DIR" 2>/dev/null | cut -f1)
        echo "  Data provider logs: $dp_size"
        local dp_bytes=$(du -sb "$DATA_PROVIDER_LOGS_DIR" 2>/dev/null | cut -f1)
        total_size=$((total_size + dp_bytes))
    fi
    
    # Convert total size to human readable
    if [ "$total_size" -gt 0 ]; then
        local total_human=$(numfmt --to=iec --suffix=B $total_size 2>/dev/null || echo "${total_size}B")
        echo "  Total: $total_human"
    fi
}

# Main execution
main() {
    # Show current log sizes
    show_log_sizes
    echo ""
    
    # Ask for confirmation
    print_warning "This will clear ALL log files. Continue? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        print_info "Log clearing cancelled"
        exit 0
    fi
    
    echo ""
    print_info "Starting log clearing process..."
    
    # Clear PM2 logs
    clear_pm2_logs
    
    # Clear KlimaKontrol application logs
    clear_directory_logs "$KLIMAKONTROL_LOGS_DIR" "KlimaKontrol"
    
    # Clear project logs
    clear_directory_logs "$PROJECT_LOGS_DIR" "Project"
    
    # Clear data provider logs
    clear_directory_logs "$DATA_PROVIDER_LOGS_DIR" "Data Provider"
    
    echo ""
    print_status "Log clearing completed!"
    
    # Show final sizes
    print_info "Remaining log sizes:"
    show_log_sizes
    
    # Restart PM2 processes to ensure clean logs
    if command -v pm2 &> /dev/null; then
        print_info "Restarting PM2 processes for clean logs..."
        pm2 restart all 2>/dev/null || print_warning "PM2 restart failed or no processes running"
    fi
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "KlimaKontrol Log Clearing Tool"
        echo ""
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --force, -f    Skip confirmation prompt"
        echo "  --dry-run, -d  Show what would be cleared without actually clearing"
        echo ""
        echo "This script clears logs from:"
        echo "  - PM2 logs (~/.pm2/logs/)"
        echo "  - KlimaKontrol logs (/opt/klimakontrol/logs/)"
        echo "  - Project logs (/home/chris/projects/KlimaKontrol/logs/)"
        echo "  - Data provider logs (tools-submodule/data_provider/logs/)"
        exit 0
        ;;
    --force|-f)
        # Skip confirmation
        show_log_sizes
        echo ""
        print_info "Force mode: clearing all logs without confirmation..."
        clear_pm2_logs
        clear_directory_logs "$KLIMAKONTROL_LOGS_DIR" "KlimaKontrol"
        clear_directory_logs "$PROJECT_LOGS_DIR" "Project"
        clear_directory_logs "$DATA_PROVIDER_LOGS_DIR" "Data Provider"
        print_status "Log clearing completed!"
        exit 0
        ;;
    --dry-run|-d)
        # Show what would be cleared
        print_info "Dry run mode: showing what would be cleared..."
        show_log_sizes
        echo ""
        print_info "Would clear logs from:"
        echo "  - PM2 logs: $PM2_LOGS_DIR"
        echo "  - KlimaKontrol logs: $KLIMAKONTROL_LOGS_DIR"
        echo "  - Project logs: $PROJECT_LOGS_DIR"
        echo "  - Data provider logs: $DATA_PROVIDER_LOGS_DIR"
        exit 0
        ;;
    "")
        # Normal execution with confirmation
        main
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac
