"""
SensorPush API client for fetching sensor data.
"""

import requests
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import logging

from .logger import get_logger

logger = get_logger(__name__)


class SensorPushClient:
    """Client for interacting with SensorPush API."""
    
    def __init__(
        self,
        api_url: str,
        email: str,
        password: str,
        max_samples_per_request: int = 1000,
        rate_limit_delay_ms: int = 60000,
        max_sensors_per_batch: int = 50
    ):
        """
        Initialize SensorPush API client.
        
        Args:
            api_url: SensorPush API base URL
            email: SensorPush account email
            password: SensorPush account password
            max_samples_per_request: Maximum samples per API request
            rate_limit_delay_ms: Delay between requests in milliseconds
            max_sensors_per_batch: Maximum sensors to query in one batch
        """
        self.api_url = api_url.rstrip('/')
        self.email = email
        self.password = password
        self.max_samples_per_request = max_samples_per_request
        self.rate_limit_delay_ms = rate_limit_delay_ms
        self.max_sensors_per_batch = max_sensors_per_batch
        
        # Token management
        self._authorization_token = None
        self._authorization_token_expire = None
        self._access_token = None
        self._access_token_expire = None
        
        # Session for connection pooling
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
        logger.info("SensorPush client initialized")
    
    def _is_token_valid(self, token: str, expire_time: datetime) -> bool:
        """Check if token is still valid with 5-minute safety margin."""
        if not token or not expire_time:
            return False
        return datetime.now() + timedelta(minutes=5) < expire_time
    
    def _get_authorization_token(self) -> str:
        """Get valid authorization token."""
        if not self._is_token_valid(self._authorization_token, self._authorization_token_expire):
            self._request_authorization_token()
        return self._authorization_token
    
    def _get_access_token(self) -> str:
        """Get valid access token."""
        if not self._is_token_valid(self._access_token, self._access_token_expire):
            self._request_access_token()
        return self._access_token
    
    def _request_authorization_token(self):
        """Request authorization token from SensorPush API."""
        logger.debug("Requesting authorization token")
        
        endpoint = f"{self.api_url}/api/v1/oauth/authorize"
        data = {
            "email": self.email,
            "password": self.password
        }
        
        try:
            response = self.session.post(endpoint, json=data, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            if 'authorization' in result:
                self._authorization_token = result['authorization']
                self._authorization_token_expire = datetime.now() + timedelta(minutes=60)
                logger.debug("Authorization token obtained successfully")
            else:
                raise ValueError("No authorization token in response")
                
        except Exception as e:
            logger.error(f"Failed to get authorization token: {e}")
            raise
    
    def _request_access_token(self):
        """Request access token using authorization token."""
        logger.debug("Requesting access token")
        
        endpoint = f"{self.api_url}/api/v1/oauth/accesstoken"
        data = {
            "authorization": self._get_authorization_token()
        }
        
        try:
            response = self.session.post(endpoint, json=data, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            if 'accesstoken' in result:
                self._access_token = result['accesstoken']
                self._access_token_expire = datetime.now() + timedelta(minutes=30)
                logger.debug("Access token obtained successfully")
            else:
                raise ValueError("No access token in response")
                
        except Exception as e:
            logger.error(f"Failed to get access token: {e}")
            raise
    
    def _make_authenticated_request(self, endpoint: str, data: Dict = None) -> Dict:
        """
        Make authenticated request to SensorPush API.
        
        Args:
            endpoint: API endpoint
            data: Request data
            
        Returns:
            API response data
        """
        url = f"{self.api_url}{endpoint}"
        headers = {
            'Authorization': self._get_access_token()
        }
        
        try:
            if data:
                response = self.session.post(url, json=data, headers=headers, timeout=30)
            else:
                response = self.session.post(url, headers=headers, timeout=30)
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {e}")
            raise
    
    def get_gateways(self) -> Dict:
        """
        Get list of gateways.
        
        Returns:
            Gateways data from API
        """
        logger.debug("Fetching gateways")
        return self._make_authenticated_request("/api/v1/devices/gateways")
    
    def get_sensors(self) -> Dict:
        """
        Get list of sensors.
        
        Returns:
            Sensors data from API
        """
        logger.debug("Fetching sensors")
        return self._make_authenticated_request("/api/v1/devices/sensors")
    
    def get_samples(
        self,
        sensor_ids: List[str],
        start_time: datetime,
        end_time: datetime,
        limit: Optional[int] = None
    ) -> Dict:
        """
        Get sensor samples for specified sensors and time range.
        
        Args:
            sensor_ids: List of sensor IDs to query
            start_time: Start time for data range
            end_time: End time for data range
            limit: Maximum number of samples to return
            
        Returns:
            Samples data from API
        """
        if not sensor_ids:
            return {"sensors": {}, "samples": {}, "total_samples": 0, "total_sensors": 0}
        
        logger.debug(f"Fetching samples for {len(sensor_ids)} sensors from {start_time} to {end_time}")
        
        # Format timestamps for API
        start_ts = start_time.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
        end_ts = end_time.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
        
        data = {
            "sensors": sensor_ids,
            "startTime": start_ts,
            "stopTime": end_ts,
            "limit": limit or self.max_samples_per_request
        }
        
        return self._make_authenticated_request("/api/v1/samples", data)
    
    def get_samples_batch(
        self,
        sensor_batches: List[List[str]],
        start_time: datetime,
        end_time: datetime,
        limit: Optional[int] = None
    ) -> List[Dict]:
        """
        Get samples for multiple sensor batches with rate limiting.
        
        Args:
            sensor_batches: List of sensor ID batches
            start_time: Start time for data range
            end_time: End time for data range
            limit: Maximum number of samples per request
            
        Returns:
            List of samples data from API
        """
        results = []
        
        for i, sensor_batch in enumerate(sensor_batches):
            if not sensor_batch:
                continue
            
            logger.debug(f"Processing sensor batch {i+1}/{len(sensor_batches)} with {len(sensor_batch)} sensors")
            
            try:
                batch_result = self.get_samples(sensor_batch, start_time, end_time, limit)
                results.append(batch_result)
                
                # Rate limiting - wait between requests
                if i < len(sensor_batches) - 1:  # Don't wait after last batch
                    logger.debug(f"Rate limiting: waiting {self.rate_limit_delay_ms}ms")
                    time.sleep(self.rate_limit_delay_ms / 1000.0)
                    
            except Exception as e:
                logger.error(f"Failed to fetch samples for batch {i+1}: {e}")
                # Continue with next batch instead of failing completely
                results.append({
                    "sensors": {},
                    "samples": {},
                    "total_samples": 0,
                    "total_sensors": 0,
                    "error": str(e)
                })
        
        return results
    
    def create_sensor_batches(self, sensor_ids: List[str]) -> List[List[str]]:
        """
        Create batches of sensor IDs for efficient API usage.
        
        Args:
            sensor_ids: List of all sensor IDs
            
        Returns:
            List of sensor ID batches
        """
        batches = []
        for i in range(0, len(sensor_ids), self.max_sensors_per_batch):
            batch = sensor_ids[i:i + self.max_sensors_per_batch]
            batches.append(batch)
        
        logger.debug(f"Created {len(batches)} sensor batches with max {self.max_sensors_per_batch} sensors each")
        return batches
    
    def test_connection(self) -> bool:
        """
        Test API connection and authentication.
        
        Returns:
            True if connection successful, False otherwise
        """
        try:
            # Try to get sensors as a connection test
            self.get_sensors()
            logger.info("SensorPush API connection test successful")
            return True
        except Exception as e:
            logger.error(f"SensorPush API connection test failed: {e}")
            return False
    
    def close(self):
        """Close the client and clean up resources."""
        if self.session:
            self.session.close()
        logger.info("SensorPush client closed")
