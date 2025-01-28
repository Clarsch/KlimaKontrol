import requests
import json
from datetime import datetime, timedelta
from utils.Logger import Logger



class Authorization:
    TAG = 'Authorization'

    _authorization_token = None
    _authorization_token_expire = None
    _access_token = None
    _access_token_expire = None

    def is_authorized(self):
        return self.get_access_token() != None

    def __init__(self, logger:Logger, base_url:str):
        self.logger = logger
        self.base_url = base_url
        self.request_access_token()
        logger.info(self.TAG, f"{'SUCCESSFUL' if self.is_authorized() else 'FAILED...'}")
        logger.debug(self.TAG, f"INITIALIZED for URL: {base_url}. Is successfully authorized: {self.is_authorized()}.")

    def get_authorization_token(self):
        current_time_with_safe =  datetime.now() + timedelta(minutes=5)
        if self._authorization_token == None or current_time_with_safe > self._authorization_token_expire:
            self.request_authorization_token()
            self.logger.debug(self.TAG, "AUTHORIZATION TOKEN not valid. Requesting new token.")
        return self._authorization_token
        
        
    def get_access_token(self):
        current_time_with_safe =  datetime.now() + timedelta(minutes=5)
        if self._access_token == None or current_time_with_safe > self._access_token_expire:
            self.request_access_token()
            self.logger.debug(self.TAG, "ACCESS TOKEN not valid. Requesting new token.")
        return self._access_token


    def read_json_config(self):
        data = {}
        with open('config.json', encoding='utf-8') as f:
            data = json.load(f)
        self.logger.debug(self.TAG, f"{self.read_json_config.__name__}: Reading JSON config file")
        return data

    def handle_unauthorized_post_request(self, url, data):
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        response = requests.post(url, headers = headers, json = data)
        if response.status_code == 200:
            return response
        else:
            self.logger.error(self.TAG, f'Error: {response.status_code}')
            self.logger.error(self.TAG, response.text) #Error message
            return None

    def request_authorization_token(self):
        self.logger.debug(self.TAG, "Fetching new Authorization Token")
        auth_endpoint = self.base_url + '/api/v1/oauth/authorize'
        data = self.read_json_config()
        res = self.handle_unauthorized_post_request(auth_endpoint, data)
        if res.status_code == 200 and 'authorization' in res.json():
            token = res.json()['authorization']
            self._authorization_token_expire = datetime.now() + timedelta(minutes=60) 
            self._authorization_token = token
        else:
            self.logger.error(self.TAG, f'Error: {res.status_code}')
            self.logger.error(self.TAG, res.text)  #Error message
            raise ValueError('Authorization failed')


    def request_access_token(self):
        self.logger.debug(self.TAG, "Fetching new Access Token")
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
            self.logger.error(self.TAG, f'Error: {res.status_code}')
            self.logger.error(self.TAG, res.text)  #Error message
            raise ValueError('Access token retrieval failed')
