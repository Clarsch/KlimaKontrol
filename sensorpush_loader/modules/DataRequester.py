import requests
from modules.Authorization import Authorization 
import modules.Validater as vd
import modules.Formatter as fm

class DataRequester:

    def __init__(self, authorization, base_url):
        self.auth: Authorization = authorization
        self.base_url = base_url
        
    def handle_post_request(self, url, data):
        headers = {
            'Content-Type': 'application/json',
            'Authorization': self.auth.get_access_token()
        }
        response = requests.post(url, headers= headers, json= data)
        if response.status_code == 200:        
            #fm.pritty_print_json(response.json())
            return response.json()
        else:
            print(f'Error: {response.status_code}')
            print(response.text)  # You'll likely want to see the error message as well

    def call_endpoint(self, endpoint):
        endpoint_url = self.base_url + "/" + endpoint

        data = self.handle_post_request(endpoint_url)
        
        print(f"API status is: ")
        fm.pritty_print_json(data)
       

    def list_gateways(self):
        endpoint_url = self.base_url + "/api/v1/devices/gateways"

        data = self.handle_post_request(endpoint_url, {})
        
        print(f"Gateways are: ")
        fm.pritty_print_json(data)
        

    def list_sensors(self):
        endpoint_url = self.base_url + "/api/v1/devices/sensors"

        data = self.handle_post_request(endpoint_url, {})
        
        print(f"Sensors are: ")
        fm.pritty_print_json(data)
        

    def list_samples_simple(self):
        endpoint_url = self.base_url + "/api/v1/samples"

        body = {
            "limit": 20
        }
        
        data = self.handle_post_request(endpoint_url, body)
        
        print("Samples are: ")
        fm.pritty_print_json(data)
            

    def list_samples(self, sensor_ids, max_limit, start_time, end_time):
        endpoint_url = self.base_url + "/api/v1/samples"
        '''
        body = {
            "sensors": ["16938384.41622496812705309768"],
            "limit": 1000,
            "startTime": "2025-01-025T00:00:00-0400",
            "stopTime": "2025-01-25T21:43:24.000Z"
        }
        '''

        if not vd.is_valid_datetime_format(start_time):
            print(f"Start date is not in a valid format. Valid format 2025-01-25T21:43:24.000Z, received format: {start_time}")
            return
        if not vd.is_valid_datetime_format(end_time):
            print(f"End date is not in a valid format. Valid format 2025-01-25T21:43:24.000Z, received format: {end_time}")
            return 
        if isinstance(max_limit, int):
            print(f"Max limit is not integer. Received: {max_limit}")
            return

        body = { 
            "sensors": sensor_ids.split(';'),
            "limit": int(max_limit),
            "startTime": start_time,
            "stopTime": end_time
        }
        
        data = self.handle_post_request(endpoint_url, body)
        
        print(f"Samples are: ")
        fm.pritty_print_json(data)
        
