"""
Server upload client for sending data to local KlimaKontrol server.
"""

import requests
import json
from datetime import datetime
from typing import Dict, List, Optional, Any
import logging

from .logger import get_logger

logger = get_logger(__name__)


class ServerUploader:
    """Client for uploading data to local KlimaKontrol server."""
    
    def __init__(
        self,
        base_url: str,
        upload_endpoint: str,
        batch_upload_endpoint: str,
        auth_token: str,
        timeout_seconds: int = 30,
        retry_attempts: int = 3
    ):
        """
        Initialize server upload client.
        
        Args:
            base_url: Server base URL
            upload_endpoint: Single reading upload endpoint
            batch_upload_endpoint: Batch upload endpoint
            auth_token: JWT authentication token
            timeout_seconds: Request timeout in seconds
            retry_attempts: Number of retry attempts for failed requests
        """
        self.base_url = base_url.rstrip('/')
        self.upload_endpoint = upload_endpoint
        self.batch_upload_endpoint = batch_upload_endpoint
        self.auth_token = auth_token
        self.timeout_seconds = timeout_seconds
        self.retry_attempts = retry_attempts
        
        # Session for connection pooling
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {auth_token}'
        })
        
        logger.info(f"Server uploader initialized: {self.base_url}")
    
    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        files: Optional[Dict] = None
    ) -> requests.Response:
        """
        Make HTTP request with retry logic.
        
        Args:
            method: HTTP method
            endpoint: API endpoint
            data: Request data
            files: Files to upload
            
        Returns:
            HTTP response
        """
        url = f"{self.base_url}{endpoint}"
        
        for attempt in range(self.retry_attempts):
            try:
                if method.upper() == 'POST':
                    if files:
                        # Remove Content-Type header for multipart uploads
                        headers = {k: v for k, v in self.session.headers.items() if k.lower() != 'content-type'}
                        response = self.session.post(
                            url, 
                            data=data, 
                            files=files, 
                            headers=headers,
                            timeout=self.timeout_seconds
                        )
                    else:
                        response = self.session.post(url, json=data, timeout=self.timeout_seconds)
                else:
                    response = self.session.get(url, timeout=self.timeout_seconds)
                
                response.raise_for_status()
                return response
                
            except requests.exceptions.RequestException as e:
                logger.warning(f"Request attempt {attempt + 1} failed: {e}")
                if attempt == self.retry_attempts - 1:
                    logger.error(f"All {self.retry_attempts} attempts failed for {method} {endpoint}")
                    raise
                
                # Wait before retry (exponential backoff)
                import time
                time.sleep(2 ** attempt)
    
    def test_connection(self) -> bool:
        """
        Test server connection.
        
        Returns:
            True if connection successful, False otherwise
        """
        try:
            # Try to access a simple endpoint (assuming server has a health check)
            response = self._make_request('GET', '/api/health')
            logger.info("Server connection test successful")
            return True
        except Exception as e:
            logger.error(f"Server connection test failed: {e}")
            return False
    
    def upload_single_reading(self, reading: Dict[str, Any]) -> bool:
        """
        Upload a single sensor reading.
        
        Args:
            reading: Sensor reading data
            
        Returns:
            True if upload successful, False otherwise
        """
        try:
            response = self._make_request('POST', self.upload_endpoint, data=reading)
            
            if response.status_code == 200:
                logger.debug(f"Successfully uploaded reading for sensor {reading.get('sensor_id')}")
                return True
            else:
                logger.error(f"Upload failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to upload single reading: {e}")
            return False
    
    def upload_batch_readings(self, readings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Upload multiple sensor readings in a batch.
        
        Args:
            readings: List of sensor readings
            
        Returns:
            Upload result with success status and details
        """
        if not readings:
            return {"success": True, "message": "No readings to upload", "count": 0}
        
        try:
            # Create batch ID for tracking
            batch_id = f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            # Prepare batch data
            batch_data = {
                "readings": readings,
                "batch_id": batch_id,
                "timestamp": datetime.now().isoformat() + "Z"
            }
            
            logger.info(f"Uploading batch {batch_id} with {len(readings)} readings")
            
            response = self._make_request('POST', self.batch_upload_endpoint, data=batch_data)
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"Successfully uploaded batch {batch_id}: {result}")
                return {
                    "success": True,
                    "batch_id": batch_id,
                    "count": len(readings),
                    "response": result
                }
            else:
                logger.error(f"Batch upload failed with status {response.status_code}: {response.text}")
                return {
                    "success": False,
                    "batch_id": batch_id,
                    "count": len(readings),
                    "error": response.text
                }
                
        except Exception as e:
            logger.error(f"Failed to upload batch readings: {e}")
            return {
                "success": False,
                "batch_id": batch_id if 'batch_id' in locals() else "unknown",
                "count": len(readings),
                "error": str(e)
            }
    
    def upload_readings_chunked(
        self,
        readings: List[Dict[str, Any]],
        chunk_size: int = 100
    ) -> Dict[str, Any]:
        """
        Upload readings in chunks to avoid overwhelming the server.
        
        Args:
            readings: List of all readings to upload
            chunk_size: Number of readings per chunk
            
        Returns:
            Overall upload result
        """
        if not readings:
            return {"success": True, "total_count": 0, "chunks_processed": 0}
        
        total_count = len(readings)
        chunks_processed = 0
        successful_chunks = 0
        failed_chunks = 0
        
        logger.info(f"Uploading {total_count} readings in chunks of {chunk_size}")
        
        # Process readings in chunks
        for i in range(0, total_count, chunk_size):
            chunk = readings[i:i + chunk_size]
            chunk_number = chunks_processed + 1
            
            logger.debug(f"Processing chunk {chunk_number} with {len(chunk)} readings")
            
            result = self.upload_batch_readings(chunk)
            chunks_processed += 1
            
            if result["success"]:
                successful_chunks += 1
            else:
                failed_chunks += 1
                logger.error(f"Chunk {chunk_number} failed: {result.get('error', 'Unknown error')}")
        
        success_rate = (successful_chunks / chunks_processed * 100) if chunks_processed > 0 else 0
        
        logger.info(f"Chunked upload completed: {successful_chunks}/{chunks_processed} chunks successful ({success_rate:.1f}%)")
        
        return {
            "success": failed_chunks == 0,
            "total_count": total_count,
            "chunks_processed": chunks_processed,
            "successful_chunks": successful_chunks,
            "failed_chunks": failed_chunks,
            "success_rate": round(success_rate, 2)
        }
    
    def get_upload_stats(self) -> Dict[str, Any]:
        """
        Get upload statistics (if server provides this endpoint).
        
        Returns:
            Upload statistics
        """
        try:
            response = self._make_request('GET', '/api/data/upload/stats')
            return response.json()
        except Exception as e:
            logger.warning(f"Could not get upload stats: {e}")
            return {}
    
    def close(self):
        """Close the upload client and clean up resources."""
        if self.session:
            self.session.close()
        logger.info("Server uploader closed")
