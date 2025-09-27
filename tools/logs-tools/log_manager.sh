#!/bin/bash
# KlimaKontrol Log Management Tool
# Comprehensive log management including clearing, rotation, and monitoring

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_header() { echo -e "${CYAN}🔧 $1${NC}"; }

# Configuration
PM2_LOGS_DIR="$HOME/.pm2/logs"
KLIMAKONTROL_LOGS_DIR="/opt/klimakontrol/logs"
PROJECT_LOGS_DIR="/home/chris/projects/KlimaKontrol/logs"
DATA_PROVIDER_LOGS_DIR="/home/chris/projects/KlimaKontrol/tools-submodule/data_provider/logs"

# Function to show help
show_help() {
    echo "KlimaKontrol Log Management Tool"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  clear           Clear all log files"
    echo "  status          Show log status and sizes"
    echo "  monitor         Monitor logs in real-time"
    echo "  rotate          Rotate logs (backup and clear)"
    echo "  tail            Tail specific service logs"
    echo "  search          Search for specific text in logs"
    echo "  archive         Archive old logs"
    echo ""
    echo "Options:"
    echo "  --force, -f     Skip confirmation prompts"
    echo "  --help, -h      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 clear                    # Clear all logs with confirmation"
    echo "  $0 clear --force           # Clear all logs without confirmation"
    echo "  $0 status                  # Show current log status"
    echo "  $0 monitor                 # Monitor all logs in real-time"
    echo "  $0 tail klima-server       # Tail server logs"
    echo "  $0 search 'error'          # Search for 'error' in all logs"
    echo "  $0 rotate                  # Rotate and backup logs"
}

# Function to show log status
show_status() {
    print_header "Log Status Report"
    echo ""
    
    local total_size=0
    local total_files=0
    
    # PM2 logs
    if [ -d "$PM2_LOGS_DIR" ]; then
        local pm2_size=$(du -sh "$PM2_LOGS_DIR" 2>/dev/null | cut -f1)
        local pm2_files=$(find "$PM2_LOGS_DIR" -type f \( -name "*.log" -o -name "*.out" -o -name "*.err" \) 2>/dev/null | wc -l)
        echo "📊 PM2 Logs:"
        echo "  Directory: $PM2_LOGS_DIR"
        echo "  Size: $pm2_size"
        echo "  Files: $pm2_files"
        echo ""
        total_files=$((total_files + pm2_files))
    fi
    
    # KlimaKontrol logs
    if [ -d "$KLIMAKONTROL_LOGS_DIR" ]; then
        local kk_size=$(du -sh "$KLIMAKONTROL_LOGS_DIR" 2>/dev/null | cut -f1)
        local kk_files=$(find "$KLIMAKONTROL_LOGS_DIR" -type f \( -name "*.log" -o -name "*.out" -o -name "*.err" \) 2>/dev/null | wc -l)
        echo "📊 KlimaKontrol Logs:"
        echo "  Directory: $KLIMAKONTROL_LOGS_DIR"
        echo "  Size: $kk_size"
        echo "  Files: $kk_files"
        echo ""
        total_files=$((total_files + kk_files))
    fi
    
    # Project logs
    if [ -d "$PROJECT_LOGS_DIR" ]; then
        local proj_size=$(du -sh "$PROJECT_LOGS_DIR" 2>/dev/null | cut -f1)
        local proj_files=$(find "$PROJECT_LOGS_DIR" -type f \( -name "*.log" -o -name "*.out" -o -name "*.err" \) 2>/dev/null | wc -l)
        echo "📊 Project Logs:"
        echo "  Directory: $PROJECT_LOGS_DIR"
        echo "  Size: $proj_size"
        echo "  Files: $proj_files"
        echo ""
        total_files=$((total_files + proj_files))
    fi
    
    # Data provider logs
    if [ -d "$DATA_PROVIDER_LOGS_DIR" ]; then
        local dp_size=$(du -sh "$DATA_PROVIDER_LOGS_DIR" 2>/dev/null | cut -f1)
        local dp_files=$(find "$DATA_PROVIDER_LOGS_DIR" -type f \( -name "*.log" -o -name "*.out" -o -name "*.err" \) 2>/dev/null | wc -l)
        echo "📊 Data Provider Logs:"
        echo "  Directory: $DATA_PROVIDER_LOGS_DIR"
        echo "  Size: $dp_size"
        echo "  Files: $dp_files"
        echo ""
        total_files=$((total_files + dp_files))
    fi
    
    echo "📈 Summary:"
    echo "  Total log files: $total_files"
    
    # Show PM2 process status
    if command -v pm2 &> /dev/null; then
        echo ""
        print_info "PM2 Process Status:"
        pm2 status 2>/dev/null || print_warning "No PM2 processes running"
    fi
}

# Function to clear logs
clear_logs() {
    local force_mode="$1"
    
    print_header "Clearing All Logs"
    
    if [ "$force_mode" != "true" ]; then
        show_status
        echo ""
        print_warning "This will clear ALL log files. Continue? (y/N)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            print_info "Log clearing cancelled"
            return 0
        fi
    fi
    
    # Clear PM2 logs
    if command -v pm2 &> /dev/null; then
        print_info "Clearing PM2 logs..."
        pm2 flush 2>/dev/null || true
        print_status "PM2 logs flushed"
    fi
    
    # Clear all log directories
    for dir in "$PM2_LOGS_DIR" "$KLIMAKONTROL_LOGS_DIR" "$PROJECT_LOGS_DIR" "$DATA_PROVIDER_LOGS_DIR"; do
        if [ -d "$dir" ]; then
            local file_count=$(find "$dir" -type f \( -name "*.log" -o -name "*.out" -o -name "*.err" \) 2>/dev/null | wc -l)
            if [ "$file_count" -gt 0 ]; then
                find "$dir" -type f \( -name "*.log" -o -name "*.out" -o -name "*.err" \) -delete 2>/dev/null
                print_status "Cleared $file_count files from $(basename "$dir")"
            fi
        fi
    done
    
    print_status "Log clearing completed!"
}

# Function to monitor logs
monitor_logs() {
    print_header "Monitoring All Logs"
    echo "Press Ctrl+C to stop monitoring"
    echo ""
    
    # Find all log files
    local log_files=()
    for dir in "$PM2_LOGS_DIR" "$KLIMAKONTROL_LOGS_DIR" "$PROJECT_LOGS_DIR" "$DATA_PROVIDER_LOGS_DIR"; do
        if [ -d "$dir" ]; then
            while IFS= read -r -d '' file; do
                log_files+=("$file")
            done < <(find "$dir" -type f \( -name "*.log" -o -name "*.out" -o -name "*.err" \) -print0 2>/dev/null)
        fi
    done
    
    if [ ${#log_files[@]} -eq 0 ]; then
        print_warning "No log files found to monitor"
        return 1
    fi
    
    print_info "Monitoring ${#log_files[@]} log files..."
    tail -f "${log_files[@]}"
}

# Function to tail specific service logs
tail_service() {
    local service="$1"
    
    if [ -z "$service" ]; then
        print_error "Please specify a service name"
        echo "Available services: klima-server, klima-ngrok, data-provider"
        return 1
    fi
    
    print_header "Tailing $service logs"
    
    # Try PM2 first
    if command -v pm2 &> /dev/null; then
        pm2 logs "$service" 2>/dev/null && return 0
    fi
    
    # Fallback to file-based logging
    local log_file=""
    case "$service" in
        "klima-server")
            log_file="$KLIMAKONTROL_LOGS_DIR/klima-server/combined.log"
            ;;
        "klima-ngrok")
            log_file="$KLIMAKONTROL_LOGS_DIR/klima-ngrok/combined.log"
            ;;
        "data-provider")
            log_file="$KLIMAKONTROL_LOGS_DIR/data-provider/combined.log"
            ;;
        *)
            print_error "Unknown service: $service"
            return 1
            ;;
    esac
    
    if [ -f "$log_file" ]; then
        tail -f "$log_file"
    else
        print_warning "Log file not found: $log_file"
        return 1
    fi
}

# Function to search logs
search_logs() {
    local search_term="$1"
    
    if [ -z "$search_term" ]; then
        print_error "Please provide a search term"
        return 1
    fi
    
    print_header "Searching for '$search_term' in all logs"
    echo ""
    
    local found=false
    
    for dir in "$PM2_LOGS_DIR" "$KLIMAKONTROL_LOGS_DIR" "$PROJECT_LOGS_DIR" "$DATA_PROVIDER_LOGS_DIR"; do
        if [ -d "$dir" ]; then
            local results=$(grep -r "$search_term" "$dir" 2>/dev/null || true)
            if [ -n "$results" ]; then
                echo "📁 $(basename "$dir"):"
                echo "$results" | sed 's/^/  /'
                echo ""
                found=true
            fi
        fi
    done
    
    if [ "$found" = false ]; then
        print_warning "No matches found for '$search_term'"
    fi
}

# Function to rotate logs
rotate_logs() {
    print_header "Rotating Logs"
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local archive_dir="/opt/klimakontrol/logs/archive/$timestamp"
    
    print_info "Creating archive directory: $archive_dir"
    sudo mkdir -p "$archive_dir"
    
    # Archive logs
    for dir in "$KLIMAKONTROL_LOGS_DIR" "$PROJECT_LOGS_DIR" "$DATA_PROVIDER_LOGS_DIR"; do
        if [ -d "$dir" ]; then
            local dir_name=$(basename "$dir")
            print_info "Archiving $dir_name logs..."
            sudo cp -r "$dir" "$archive_dir/$dir_name" 2>/dev/null || true
        fi
    done
    
    # Clear current logs
    clear_logs "true"
    
    print_status "Log rotation completed! Archive saved to: $archive_dir"
}

# Main execution
main() {
    local command="${1:-}"
    local force_mode="false"
    
    # Parse arguments
    shift 2>/dev/null || true
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force|-f)
                force_mode="true"
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                shift
                ;;
        esac
    done
    
    case "$command" in
        "clear")
            clear_logs "$force_mode"
            ;;
        "status")
            show_status
            ;;
        "monitor")
            monitor_logs
            ;;
        "tail")
            tail_service "$2"
            ;;
        "search")
            search_logs "$2"
            ;;
        "rotate")
            rotate_logs
            ;;
        "archive")
            rotate_logs
            ;;
        "")
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
