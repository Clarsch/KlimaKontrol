import requests
import json
from datetime import datetime, timedelta
import modules.Formatter as fm


class Authorization:

    _authorization_token = None
    _authorization_token_expire = None
    _access_token = None
    _access_token_expire = None
    

    def is_authorized(self):
        return self.get_access_token() != None

    def __init__(self, base_url):
        self.base_url = base_url
        self.request_access_token()


    def get_authorization_token(self):
        current_time_with_safe =  datetime.now() + timedelta(minutes=5)
        if self._authorization_token == None or current_time_with_safe > self._authorization_token_expire:
            self.request_authorization_token()

        return self._authorization_token
        
        
    def get_access_token(self):
        current_time_with_safe =  datetime.now() + timedelta(minutes=5)
        if self._access_token == None or current_time_with_safe > self._access_token_expire:
            self.request_access_token()

        return self._access_token


    def read_json_config(self):
        data = {}
        with open('config.json', encoding='utf-8') as f:
            data = json.load(f)
        return data

    def handle_unauthorized_post_request(self, url, data):
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        #print(f"Request body is: {data}")

        response = requests.post(url, headers = headers, json = data)
        if response.status_code == 200:
            #print(response.json())
            return response
        else:
            print(f'Error: {response.status_code}')
            print(response.text)  # You'll likely want to see the error message as well
            return None

    def request_authorization_token(self):
        auth_endpoint = self.base_url + '/api/v1/oauth/authorize'
        data = self.read_json_config()
        #print(f"Config is: {data}")
        res = self.handle_unauthorized_post_request(auth_endpoint, data)
        #print(f"Response is: {res}")
        if res.status_code == 200 and 'authorization' in res.json():
            token = res.json()['authorization']
            self._authorization_token_expire = datetime.now() + timedelta(minutes=60) 
            self._authorization_token = token
        else:
            print(f'Error: {res.status_code}')
            print(res.text)  # You'll likely want to see the error message as well
            raise ValueError('Authorization failed')


    def request_access_token(self):
        access_endpoint = self.base_url + '/api/v1/oauth/accesstoken'
        data = {
            'authorization': self.get_authorization_token()
        }
        res = self.handle_unauthorized_post_request(access_endpoint, data)
        if res.status_code == 200 and 'accesstoken' in res.json():
            token = res.json()['accesstoken']
            self._access_token_expire = datetime.now() + timedelta(minutes=30)
            self._access_token = token
        else:
            print(f'Error: {res.status_code}')
            print(res.text)  # You'll likely want to see the error message as well
            raise ValueError('Access and refresh token retrieval failed')
