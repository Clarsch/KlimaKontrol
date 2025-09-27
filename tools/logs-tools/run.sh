#!/bin/bash
# Simple launcher for log management tools

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Make all scripts executable
chmod +x "$SCRIPT_DIR"/*.sh

# Run the log manager with all arguments
"$SCRIPT_DIR/log_manager.sh" "$@"
