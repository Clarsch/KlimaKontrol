import requests
from sensorpush_loader.modules.Authorization import Authorization 
import sensorpush_loader.modules.Validater as vd
import sensorpush_loader.modules.Formatter as fm
from utils.Logger import Logger

class DataRequester:
    TAG = 'DataRequester'

    def __init__(self, logger:Logger, auth:Authorization, base_url):
        self.logger = logger
        self.auth = auth
        self.base_url = base_url
        logger.info(self.TAG, f"INITIALIZED.")

        
    def handle_post_request(self, url, data):
        headers = {
            'Content-Type': 'application/json',
            'Authorization': self.auth.get_access_token()
        }
        response = requests.post(url, headers= headers, json= data)
        if response.status_code == 200:        
            self.logger.debug(self.TAG, f"Received: {fm.prettify_json(response.json())}")
            return response.json()
        else:
            print(f'Error: {response.status_code}')
            print(response.text)  # You'll likely want to see the error message as well

    def call_endpoint(self, endpoint):
        endpoint_url = self.base_url + "/" + endpoint
        data = self.handle_post_request(endpoint_url)
        print(f"API status is: {fm.prettify_json(data)}")
       

    def list_gateways(self):
        endpoint_url = self.base_url + "/api/v1/devices/gateways"
        data = self.handle_post_request(endpoint_url, {})
        print(f"Gateways are: {fm.prettify_json(data)}")
        

    def list_sensors(self):
        endpoint_url = self.base_url + "/api/v1/devices/sensors"
        data = self.handle_post_request(endpoint_url, {})
        print(f"Sensors are: {fm.prettify_json(data)}")
        

    def list_samples_simple(self):
        endpoint_url = self.base_url + "/api/v1/samples"
        body = {
            "limit": 20
        }
        data = self.handle_post_request(endpoint_url, body)
        print(f"Samples are: {fm.prettify_json(data)}")
            
    def get_data_observations(
            self, sensor_ids:list[str], 
            max_limit:int, 
            start_time:str, 
            end_time:str
            ):
        endpoint_url = self.base_url + "/api/v1/samples"
        '''
        body = {
            "sensors": ["16938384.41622496812705309768"],
            "limit": 1000,
            "startTime": "2025-01-025T00:00:00-0400",
            "stopTime": "2025-01-25T21:43:24.000Z"
        }
        '''
        self.logger.debug(self.TAG, f"Getting observations...")

        if not vd.is_valid_datetime_format(start_time):
            self.logger.warning(self.TAG, f"ValidationError: Start date is not in a valid format. Valid format 2025-01-25T21:43:24.000Z, received format: {start_time}")
            return
        if not vd.is_valid_datetime_format(end_time):
            self.logger.warning(self.TAG, f"ValidationError: End date is not in a valid format. Valid format 2025-01-25T21:43:24.000Z, received format: {end_time}")
            return 
        if not isinstance(max_limit, int):
            self.logger.warning(self.TAG, f"ValidationError: Max limit is not integer. Received: {max_limit}")
            return

        body = { 
            "sensors": sensor_ids,
            "limit": max_limit,
            "startTime": start_time,
            "stopTime": end_time
        }
        
        return self.handle_post_request(endpoint_url, body)

    def list_samples(self, sensor_ids, max_limit, start_time, end_time):
        data = self.get_data_observations(sensor_ids.split(';'), max_limit, start_time, end_time)
        
        print(f"Samples are: {fm.prettify_json(data)}")
        
