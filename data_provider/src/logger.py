"""
Logging configuration for the data provider service.
"""

import logging
import logging.handlers
import os
import sys
from pathlib import Path
from typing import Optional
import structlog
from datetime import datetime


class DataProviderLogger:
    """Centralized logging configuration for the data provider service."""
    
    def __init__(
        self,
        log_level: str = "INFO",
        log_dir: str = "./logs",
        max_bytes: int = 10485760,  # 10MB
        backup_count: int = 5,
        console_output: bool = True,
        structured_logging: bool = True
    ):
        """
        Initialize logger configuration.
        
        Args:
            log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
            log_dir: Directory for log files
            max_bytes: Maximum size of log files before rotation
            backup_count: Number of backup files to keep
            console_output: Whether to output logs to console
            structured_logging: Whether to use structured logging
        """
        self.log_level = getattr(logging, log_level.upper())
        self.log_dir = Path(log_dir)
        self.max_bytes = max_bytes
        self.backup_count = backup_count
        self.console_output = console_output
        self.structured_logging = structured_logging
        
        # Create log directory
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        # Configure logging
        self._setup_logging()
    
    def _setup_logging(self):
        """Setup logging configuration."""
        # Clear existing handlers
        root_logger = logging.getLogger()
        root_logger.handlers.clear()
        
        # Set root logger level
        root_logger.setLevel(self.log_level)
        
        # Create formatters
        if self.structured_logging:
            self._setup_structured_logging()
        else:
            self._setup_standard_logging()
    
    def _setup_structured_logging(self):
        """Setup structured logging with structlog."""
        # Configure structlog
        structlog.configure(
            processors=[
                structlog.stdlib.filter_by_level,
                structlog.stdlib.add_logger_name,
                structlog.stdlib.add_log_level,
                structlog.stdlib.PositionalArgumentsFormatter(),
                structlog.processors.TimeStamper(fmt="iso"),
                structlog.processors.StackInfoRenderer(),
                structlog.processors.format_exc_info,
                structlog.processors.UnicodeDecoder(),
                structlog.processors.JSONRenderer()
            ],
            context_class=dict,
            logger_factory=structlog.stdlib.LoggerFactory(),
            wrapper_class=structlog.stdlib.BoundLogger,
            cache_logger_on_first_use=True,
        )
        
        # Create handlers
        self._create_handlers()
    
    def _setup_standard_logging(self):
        """Setup standard Python logging."""
        # Create formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        # Create handlers
        self._create_handlers(formatter)
    
    def _create_handlers(self, formatter: Optional[logging.Formatter] = None):
        """Create log handlers."""
        # Main log file handler
        main_log_file = self.log_dir / "data_provider.log"
        main_handler = logging.handlers.RotatingFileHandler(
            main_log_file,
            maxBytes=self.max_bytes,
            backupCount=self.backup_count,
            encoding='utf-8'
        )
        if formatter:
            main_handler.setFormatter(formatter)
        main_handler.setLevel(self.log_level)
        
        # Error log file handler
        error_log_file = self.log_dir / "error.log"
        error_handler = logging.handlers.RotatingFileHandler(
            error_log_file,
            maxBytes=self.max_bytes,
            backupCount=self.backup_count,
            encoding='utf-8'
        )
        if formatter:
            error_handler.setFormatter(formatter)
        error_handler.setLevel(logging.ERROR)
        
        # Debug log file handler (only for DEBUG level)
        if self.log_level == logging.DEBUG:
            debug_log_file = self.log_dir / "debug.log"
            debug_handler = logging.handlers.RotatingFileHandler(
                debug_log_file,
                maxBytes=self.max_bytes,
                backupCount=self.backup_count,
                encoding='utf-8'
            )
            if formatter:
                debug_handler.setFormatter(formatter)
            debug_handler.setLevel(logging.DEBUG)
        
        # Console handler
        if self.console_output:
            console_handler = logging.StreamHandler(sys.stdout)
            if formatter:
                console_handler.setFormatter(formatter)
            console_handler.setLevel(self.log_level)
        
        # Add handlers to root logger
        root_logger = logging.getLogger()
        root_logger.addHandler(main_handler)
        root_logger.addHandler(error_handler)
        
        if self.log_level == logging.DEBUG:
            root_logger.addHandler(debug_handler)
        
        if self.console_output:
            root_logger.addHandler(console_handler)
    
    def get_logger(self, name: str) -> logging.Logger:
        """
        Get a logger instance.
        
        Args:
            name: Logger name (usually __name__)
            
        Returns:
            Logger instance
        """
        return logging.getLogger(name)
    
    def get_structured_logger(self, name: str):
        """
        Get a structured logger instance.
        
        Args:
            name: Logger name (usually __name__)
            
        Returns:
            Structured logger instance
        """
        if self.structured_logging:
            return structlog.get_logger(name)
        else:
            return self.get_logger(name)


# Global logger instance
_logger_instance: Optional[DataProviderLogger] = None


def initialize_logger(
    log_level: str = "INFO",
    log_dir: str = "./logs",
    max_bytes: int = 10485760,
    backup_count: int = 5,
    console_output: bool = True,
    structured_logging: bool = True
) -> DataProviderLogger:
    """
    Initialize global logger.
    
    Args:
        log_level: Logging level
        log_dir: Directory for log files
        max_bytes: Maximum size of log files before rotation
        backup_count: Number of backup files to keep
        console_output: Whether to output logs to console
        structured_logging: Whether to use structured logging
        
    Returns:
        Logger instance
    """
    global _logger_instance
    _logger_instance = DataProviderLogger(
        log_level=log_level,
        log_dir=log_dir,
        max_bytes=max_bytes,
        backup_count=backup_count,
        console_output=console_output,
        structured_logging=structured_logging
    )
    return _logger_instance


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance from global logger.
    
    Args:
        name: Logger name (usually __name__)
        
    Returns:
        Logger instance
    """
    if _logger_instance is None:
        # Initialize with defaults if not already initialized
        initialize_logger()
    
    return _logger_instance.get_logger(name)


def get_structured_logger(name: str):
    """
    Get a structured logger instance from global logger.
    
    Args:
        name: Logger name (usually __name__)
        
    Returns:
        Structured logger instance
    """
    if _logger_instance is None:
        # Initialize with defaults if not already initialized
        initialize_logger()
    
    return _logger_instance.get_structured_logger(name)


# Convenience functions for common logging patterns
def log_service_start(service_name: str, version: str = "1.0.0"):
    """Log service startup."""
    logger = get_logger(__name__)
    logger.info(f"Starting {service_name} v{version}")


def log_service_stop(service_name: str):
    """Log service shutdown."""
    logger = get_logger(__name__)
    logger.info(f"Stopping {service_name}")


def log_database_operation(operation: str, table: str, count: int = None):
    """Log database operations."""
    logger = get_logger(__name__)
    if count is not None:
        logger.info(f"Database {operation} on {table}: {count} records")
    else:
        logger.info(f"Database {operation} on {table}")


def log_api_call(api_name: str, endpoint: str, status_code: int, duration_ms: float = None):
    """Log API calls."""
    logger = get_logger(__name__)
    if duration_ms is not None:
        logger.info(f"API {api_name} {endpoint}: {status_code} ({duration_ms:.2f}ms)")
    else:
        logger.info(f"API {api_name} {endpoint}: {status_code}")


def log_error_with_context(error: Exception, context: str = ""):
    """Log errors with context."""
    logger = get_logger(__name__)
    if context:
        logger.error(f"Error in {context}: {str(error)}", exc_info=True)
    else:
        logger.error(f"Error: {str(error)}", exc_info=True)
