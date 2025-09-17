"""
Database connection management for the data provider service.
"""

import os
import sqlite3
from pathlib import Path
from typing import Optional
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
import logging

from .models import Base

logger = logging.getLogger(__name__)


class DatabaseConnection:
    """Manages database connection and session creation."""
    
    def __init__(self, database_path: str):
        """
        Initialize database connection.
        
        Args:
            database_path: Path to SQLite database file.
        """
        self.database_path = Path(database_path)
        self.engine = None
        self.SessionLocal = None
        self._setup_database()
    
    def _setup_database(self):
        """Setup database engine and session factory."""
        # Ensure database directory exists
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Create SQLite engine with optimized settings
        database_url = f"sqlite:///{self.database_path}"
        
        self.engine = create_engine(
            database_url,
            poolclass=StaticPool,
            connect_args={
                "check_same_thread": False,
                "timeout": 30
            },
            echo=False  # Set to True for SQL query logging
        )
        
        # Configure SQLite for better performance
        @event.listens_for(self.engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            # Enable foreign key constraints
            cursor.execute("PRAGMA foreign_keys=ON")
            # Set journal mode to WAL for better concurrency
            cursor.execute("PRAGMA journal_mode=WAL")
            # Set synchronous mode for better performance
            cursor.execute("PRAGMA synchronous=NORMAL")
            # Set cache size (negative value means KB)
            cursor.execute("PRAGMA cache_size=-64000")  # 64MB cache
            # Set temp store to memory
            cursor.execute("PRAGMA temp_store=MEMORY")
            cursor.close()
        
        # Create session factory
        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine
        )
        
        logger.info(f"Database connection established: {self.database_path}")
    
    def create_tables(self):
        """Create all database tables."""
        try:
            Base.metadata.create_all(bind=self.engine)
            logger.info("Database tables created successfully")
        except Exception as e:
            logger.error(f"Failed to create database tables: {e}")
            raise
    
    def get_session(self) -> Session:
        """
        Get a database session.
        
        Returns:
            Database session object.
        """
        if self.SessionLocal is None:
            raise RuntimeError("Database not initialized")
        return self.SessionLocal()
    
    def close(self):
        """Close database connection."""
        if self.engine:
            self.engine.dispose()
            logger.info("Database connection closed")
    
    def backup_database(self, backup_path: str) -> bool:
        """
        Create a backup of the database.
        
        Args:
            backup_path: Path where backup should be saved.
            
        Returns:
            True if backup successful, False otherwise.
        """
        try:
            import shutil
            
            # Ensure backup directory exists
            Path(backup_path).parent.mkdir(parents=True, exist_ok=True)
            
            # Copy database file
            shutil.copy2(self.database_path, backup_path)
            
            # Verify backup integrity
            if self._verify_database_integrity(backup_path):
                logger.info(f"Database backup created: {backup_path}")
                return True
            else:
                logger.error("Database backup verification failed")
                return False
                
        except Exception as e:
            logger.error(f"Failed to create database backup: {e}")
            return False
    
    def _verify_database_integrity(self, db_path: str) -> bool:
        """
        Verify database integrity.
        
        Args:
            db_path: Path to database file.
            
        Returns:
            True if database is valid, False otherwise.
        """
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Run integrity check
            cursor.execute("PRAGMA integrity_check")
            result = cursor.fetchone()
            
            conn.close()
            
            return result[0] == "ok"
            
        except Exception as e:
            logger.error(f"Database integrity check failed: {e}")
            return False
    
    def vacuum_database(self) -> bool:
        """
        Optimize database by running VACUUM.
        
        Returns:
            True if vacuum successful, False otherwise.
        """
        try:
            with self.engine.connect() as conn:
                conn.execute("VACUUM")
                conn.commit()
            
            logger.info("Database vacuum completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Database vacuum failed: {e}")
            return False
    
    def get_database_size(self) -> int:
        """
        Get database file size in bytes.
        
        Returns:
            Database file size in bytes.
        """
        if self.database_path.exists():
            return self.database_path.stat().st_size
        return 0
    
    def get_table_info(self) -> dict:
        """
        Get information about database tables.
        
        Returns:
            Dictionary with table information.
        """
        try:
            with self.engine.connect() as conn:
                # Get table names
                result = conn.execute("""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name NOT LIKE 'sqlite_%'
                """)
                tables = [row[0] for row in result]
                
                table_info = {}
                for table in tables:
                    # Get row count
                    count_result = conn.execute(f"SELECT COUNT(*) FROM {table}")
                    row_count = count_result.scalar()
                    
                    table_info[table] = {
                        "row_count": row_count
                    }
                
                return table_info
                
        except Exception as e:
            logger.error(f"Failed to get table info: {e}")
            return {}


# Global database connection instance
_db_connection: Optional[DatabaseConnection] = None


def initialize_database(database_path: str) -> DatabaseConnection:
    """
    Initialize global database connection.
    
    Args:
        database_path: Path to SQLite database file.
        
    Returns:
        Database connection object.
    """
    global _db_connection
    _db_connection = DatabaseConnection(database_path)
    return _db_connection


def get_database() -> DatabaseConnection:
    """
    Get global database connection.
    
    Returns:
        Database connection object.
        
    Raises:
        RuntimeError: If database not initialized.
    """
    if _db_connection is None:
        raise RuntimeError("Database not initialized. Call initialize_database() first.")
    return _db_connection


def get_session() -> Session:
    """
    Get a database session from global connection.
    
    Returns:
        Database session object.
    """
    db = get_database()
    return db.get_session()


def close_database():
    """Close global database connection."""
    global _db_connection
    if _db_connection:
        _db_connection.close()
        _db_connection = None
