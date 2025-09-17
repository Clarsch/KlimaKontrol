"""
Data cleanup and retention management for the data provider service.
"""

from datetime import datetime, timedelta
from typing import Dict, Any
import logging
import shutil
from pathlib import Path

from database.connection import get_database
from .database_manager import DatabaseManager
from .state_manager import StateManager
from .logger import get_logger

logger = get_logger(__name__)


class CleanupManager:
    """Manages data cleanup and retention policies."""
    
    def __init__(
        self,
        database_manager: DatabaseManager,
        state_manager: StateManager,
        backup_enabled: bool = True,
        backup_retention_days: int = 7
    ):
        """
        Initialize cleanup manager.
        
        Args:
            database_manager: Database manager instance
            state_manager: State manager instance
            backup_enabled: Whether to create backups before cleanup
            backup_retention_days: Number of days to keep backups
        """
        self.db_manager = database_manager
        self.state_manager = state_manager
        self.backup_enabled = backup_enabled
        self.backup_retention_days = backup_retention_days
        
        logger.info("Cleanup manager initialized")
    
    def run_cleanup(
        self,
        sensor_readings_days: int,
        upload_logs_days: int,
        error_logs_days: int,
        batch_size: int = 1000,
        vacuum_after_cleanup: bool = True
    ) -> Dict[str, Any]:
        """
        Run data cleanup operation.
        
        Args:
            sensor_readings_days: Days to retain sensor readings
            upload_logs_days: Days to retain upload logs
            error_logs_days: Days to retain error logs
            batch_size: Number of records to process per batch
            vacuum_after_cleanup: Whether to vacuum database after cleanup
            
        Returns:
            Cleanup statistics
        """
        logger.info("Starting data cleanup operation")
        
        cleanup_stats = {
            "start_time": datetime.utcnow(),
            "backup_created": False,
            "readings_deleted": 0,
            "upload_logs_deleted": 0,
            "error_logs_cleared": 0,
            "database_size_before": 0,
            "database_size_after": 0,
            "vacuum_performed": False,
            "success": False,
            "error": None
        }
        
        try:
            # Get database size before cleanup
            db = get_database()
            cleanup_stats["database_size_before"] = db.get_database_size()
            
            # Create backup if enabled
            if self.backup_enabled:
                backup_created = self._create_cleanup_backup()
                cleanup_stats["backup_created"] = backup_created
                if not backup_created:
                    logger.warning("Backup creation failed, but continuing with cleanup")
            
            # Run cleanup for each data type
            readings_stats = self.db_manager.cleanup_old_data(
                retention_days=sensor_readings_days,
                batch_size=batch_size
            )
            
            cleanup_stats["readings_deleted"] = readings_stats["readings_deleted"]
            cleanup_stats["upload_logs_deleted"] = readings_stats["upload_logs_deleted"]
            cleanup_stats["error_logs_cleared"] = readings_stats["error_logs_cleared"]
            
            # Perform database vacuum if requested
            if vacuum_after_cleanup:
                logger.info("Performing database vacuum")
                vacuum_success = db.vacuum_database()
                cleanup_stats["vacuum_performed"] = vacuum_success
                if not vacuum_success:
                    logger.warning("Database vacuum failed")
            
            # Get database size after cleanup
            cleanup_stats["database_size_after"] = db.get_database_size()
            
            # Update last cleanup timestamp
            self.state_manager.set_last_cleanup(datetime.utcnow())
            
            # Clean up old backup files
            self._cleanup_old_backups()
            
            cleanup_stats["success"] = True
            cleanup_stats["end_time"] = datetime.utcnow()
            
            # Calculate space saved
            space_saved = cleanup_stats["database_size_before"] - cleanup_stats["database_size_after"]
            cleanup_stats["space_saved_bytes"] = space_saved
            cleanup_stats["space_saved_mb"] = round(space_saved / (1024 * 1024), 2)
            
            logger.info(
                f"Cleanup completed successfully: "
                f"{cleanup_stats['readings_deleted']} readings deleted, "
                f"{cleanup_stats['space_saved_mb']}MB saved"
            )
            
        except Exception as e:
            cleanup_stats["error"] = str(e)
            cleanup_stats["end_time"] = datetime.utcnow()
            logger.error(f"Cleanup operation failed: {e}")
        
        return cleanup_stats
    
    def _create_cleanup_backup(self) -> bool:
        """
        Create database backup before cleanup.
        
        Returns:
            True if backup successful, False otherwise
        """
        try:
            db = get_database()
            backup_dir = Path("./data/backups")
            backup_dir.mkdir(parents=True, exist_ok=True)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = backup_dir / f"sensor_data_backup_{timestamp}.db"
            
            success = db.backup_database(str(backup_path))
            if success:
                logger.info(f"Database backup created: {backup_path}")
            else:
                logger.error("Database backup creation failed")
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to create backup: {e}")
            return False
    
    def _cleanup_old_backups(self):
        """Remove old backup files based on retention policy."""
        try:
            backup_dir = Path("./data/backups")
            if not backup_dir.exists():
                return
            
            cutoff_date = datetime.now() - timedelta(days=self.backup_retention_days)
            removed_count = 0
            
            for backup_file in backup_dir.glob("sensor_data_backup_*.db"):
                try:
                    file_time = datetime.fromtimestamp(backup_file.stat().st_mtime)
                    if file_time < cutoff_date:
                        backup_file.unlink()
                        removed_count += 1
                        logger.debug(f"Removed old backup: {backup_file.name}")
                except Exception as e:
                    logger.warning(f"Failed to remove backup file {backup_file.name}: {e}")
            
            if removed_count > 0:
                logger.info(f"Removed {removed_count} old backup files")
                
        except Exception as e:
            logger.error(f"Failed to cleanup old backups: {e}")
    
    def get_cleanup_recommendations(self) -> Dict[str, Any]:
        """
        Get cleanup recommendations based on current database state.
        
        Returns:
            Cleanup recommendations
        """
        try:
            db_stats = self.db_manager.get_database_stats()
            db = get_database()
            current_size = db.get_database_size()
            
            recommendations = {
                "current_database_size_mb": round(current_size / (1024 * 1024), 2),
                "total_readings": db_stats.get("sensor_readings", 0),
                "unuploaded_readings": db_stats.get("unuploaded_readings", 0),
                "recommendations": []
            }
            
            # Check if cleanup is needed
            if db_stats.get("sensor_readings", 0) > 100000:  # More than 100k readings
                recommendations["recommendations"].append({
                    "type": "cleanup_needed",
                    "message": "Large number of readings detected, consider running cleanup",
                    "priority": "high"
                })
            
            if current_size > 100 * 1024 * 1024:  # More than 100MB
                recommendations["recommendations"].append({
                    "type": "size_warning",
                    "message": "Database size is large, cleanup recommended",
                    "priority": "medium"
                })
            
            if db_stats.get("unuploaded_readings", 0) > 1000:  # More than 1k unuploaded
                recommendations["recommendations"].append({
                    "type": "upload_issue",
                    "message": "Many unuploaded readings, check upload process",
                    "priority": "high"
                })
            
            # Check oldest reading age
            if "oldest_reading" in db_stats:
                try:
                    oldest_date = datetime.fromisoformat(db_stats["oldest_reading"].replace('Z', '+00:00'))
                    days_old = (datetime.utcnow() - oldest_date).days
                    
                    if days_old > 365:  # Older than 1 year
                        recommendations["recommendations"].append({
                            "type": "old_data",
                            "message": f"Oldest data is {days_old} days old, consider cleanup",
                            "priority": "low"
                        })
                except (ValueError, TypeError):
                    pass
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Failed to get cleanup recommendations: {e}")
            return {"error": str(e)}
    
    def estimate_cleanup_impact(
        self,
        sensor_readings_days: int,
        upload_logs_days: int
    ) -> Dict[str, Any]:
        """
        Estimate the impact of cleanup operation.
        
        Args:
            sensor_readings_days: Days to retain sensor readings
            upload_logs_days: Days to retain upload logs
            
        Returns:
            Cleanup impact estimation
        """
        try:
            db_stats = self.db_manager.get_database_stats()
            
            # Estimate readings to be deleted
            cutoff_date = datetime.utcnow() - timedelta(days=sensor_readings_days)
            old_readings_count = 0
            
            # This is a rough estimation - in practice, you'd query the database
            # to get exact counts for the date ranges
            total_readings = db_stats.get("sensor_readings", 0)
            if total_readings > 0:
                # Rough estimation: assume readings are evenly distributed
                # This is not accurate but gives a ballpark figure
                estimated_old_readings = max(0, total_readings - (total_readings * 0.7))  # Assume 30% are old
                old_readings_count = int(estimated_old_readings)
            
            return {
                "estimated_readings_to_delete": old_readings_count,
                "estimated_space_saved_mb": round((old_readings_count * 200) / (1024 * 1024), 2),  # ~200 bytes per reading
                "current_total_readings": total_readings,
                "retention_days": sensor_readings_days,
                "note": "Estimates are approximate and based on current data distribution"
            }
            
        except Exception as e:
            logger.error(f"Failed to estimate cleanup impact: {e}")
            return {"error": str(e)}
    
    def is_cleanup_due(self, cleanup_frequency_hours: int) -> bool:
        """
        Check if cleanup is due.
        
        Args:
            cleanup_frequency_hours: Cleanup frequency in hours
            
        Returns:
            True if cleanup is due, False otherwise
        """
        return self.state_manager.is_cleanup_due(cleanup_frequency_hours)
