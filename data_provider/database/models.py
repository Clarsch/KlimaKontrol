"""
SQLAlchemy database models for the data provider service.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, 
    ForeignKey, Index, UniqueConstraint
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class Sensor(Base):
    """Sensor configuration and metadata."""
    
    __tablename__ = "sensors"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    sensorpush_id = Column(String(100), unique=True, nullable=False, index=True)
    local_sensor_id = Column(String(50), nullable=False, index=True)
    location_id = Column(String(50), nullable=False, index=True)
    sensor_name = Column(String(100))
    device_type = Column(String(50))  # HT1, HT2, etc.
    mac_address = Column(String(17))  # MAC address
    is_active = Column(Boolean, default=True, index=True)
    battery_voltage = Column(Float)
    rssi = Column(Integer)  # Signal strength
    last_seen = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sensor_state = relationship("SensorState", back_populates="sensor", uselist=False)
    readings = relationship("SensorReading", back_populates="sensor")
    
    def __repr__(self):
        return f"<Sensor(id={self.id}, sensorpush_id='{self.sensorpush_id}', local_id='{self.local_sensor_id}')>"


class Gateway(Base):
    """Gateway information and status."""
    
    __tablename__ = "gateways"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    gateway_id = Column(String(100), unique=True, nullable=False, index=True)
    gateway_name = Column(String(100))
    is_active = Column(Boolean, default=True, index=True)
    last_seen = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Gateway(id={self.id}, gateway_id='{self.gateway_id}', name='{self.gateway_name}')>"


class SensorState(Base):
    """Per-sensor timestamps and status tracking."""
    
    __tablename__ = "sensor_state"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id"), nullable=False, unique=True)
    last_fetch_timestamp = Column(DateTime, nullable=False, index=True)
    last_successful_upload = Column(DateTime)
    total_readings_fetched = Column(Integer, default=0)
    total_readings_uploaded = Column(Integer, default=0)
    last_error_message = Column(Text)
    last_error_timestamp = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sensor = relationship("Sensor", back_populates="sensor_state")
    
    def __repr__(self):
        return f"<SensorState(sensor_id={self.sensor_id}, last_fetch='{self.last_fetch_timestamp}')>"


class SensorReading(Base):
    """Sensor data readings."""
    
    __tablename__ = "sensor_readings"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id"), nullable=False, index=True)
    record_time = Column(DateTime, nullable=False, index=True)
    temperature = Column(Float)
    relative_humidity = Column(Float)
    air_pressure = Column(Float)
    pause = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    uploaded_to_server = Column(Boolean, default=False, index=True)
    upload_attempts = Column(Integer, default=0)
    last_upload_attempt = Column(DateTime)
    error_message = Column(Text)
    
    # Relationships
    sensor = relationship("Sensor", back_populates="readings")
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint('sensor_id', 'record_time', name='uq_sensor_record_time'),
        Index('idx_sensor_time', 'sensor_id', 'record_time'),
        Index('idx_upload_status', 'uploaded_to_server', 'created_at'),
        Index('idx_retention', 'created_at'),  # For cleanup queries
    )
    
    def __repr__(self):
        return f"<SensorReading(id={self.id}, sensor_id={self.sensor_id}, time='{self.record_time}')>"


class UploadLog(Base):
    """Upload operation history."""
    
    __tablename__ = "upload_log"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(String(50), nullable=False, index=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id"), nullable=False, index=True)
    record_count = Column(Integer, nullable=False)
    success = Column(Boolean, nullable=False, index=True)
    error_message = Column(Text)
    uploaded_at = Column(DateTime, default=datetime.utcnow, index=True)
    response_data = Column(Text)
    
    # Relationships
    sensor = relationship("Sensor")
    
    def __repr__(self):
        return f"<UploadLog(id={self.id}, batch_id='{self.batch_id}', success={self.success})>"


class ServiceState(Base):
    """Global service state and configuration."""
    
    __tablename__ = "service_state"
    
    id = Column(Integer, primary_key=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<ServiceState(key='{self.key}', value='{self.value}')>"


# Database initialization functions
def create_all_tables(engine):
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)


def drop_all_tables(engine):
    """Drop all database tables."""
    Base.metadata.drop_all(bind=engine)


# Utility functions for common queries
def get_sensor_by_sensorpush_id(session, sensorpush_id: str) -> Optional[Sensor]:
    """Get sensor by SensorPush ID."""
    return session.query(Sensor).filter(Sensor.sensorpush_id == sensorpush_id).first()


def get_sensor_by_local_id(session, local_sensor_id: str) -> Optional[Sensor]:
    """Get sensor by local sensor ID."""
    return session.query(Sensor).filter(Sensor.local_sensor_id == local_sensor_id).first()


def get_active_sensors(session) -> list:
    """Get all active sensors."""
    return session.query(Sensor).filter(Sensor.is_active == True).all()


def get_sensor_state(session, sensor_id: int) -> Optional[SensorState]:
    """Get sensor state by sensor ID."""
    return session.query(SensorState).filter(SensorState.sensor_id == sensor_id).first()


def get_unuploaded_readings(session, limit: int = 1000) -> list:
    """Get readings that haven't been uploaded to server."""
    return (session.query(SensorReading)
            .filter(SensorReading.uploaded_to_server == False)
            .order_by(SensorReading.created_at)
            .limit(limit)
            .all())


def get_readings_by_sensor_and_time(
    session, 
    sensor_id: int, 
    start_time: datetime, 
    end_time: datetime
) -> list:
    """Get readings for a sensor within a time range."""
    return (session.query(SensorReading)
            .filter(SensorReading.sensor_id == sensor_id)
            .filter(SensorReading.record_time >= start_time)
            .filter(SensorReading.record_time <= end_time)
            .order_by(SensorReading.record_time)
            .all())


def get_old_readings(session, cutoff_date: datetime, limit: int = 1000) -> list:
    """Get old readings for cleanup."""
    return (session.query(SensorReading)
            .filter(SensorReading.created_at < cutoff_date)
            .filter(SensorReading.uploaded_to_server == True)
            .order_by(SensorReading.created_at)
            .limit(limit)
            .all())
