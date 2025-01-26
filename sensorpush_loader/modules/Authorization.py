import requests
import json


class Authorization:

    access_token = ""

    def isAuthorized(self):
        return self.access_token != ""

    def __init__(self, base_url):
        self.base_url = base_url
        self.authorize()


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

    def get_authorization_token(self):
        auth_endpoint = self.base_url + '/api/v1/oauth/authorize'
        data = self.read_json_config()
        #print(f"Config is: {data}")
        res = self.handle_unauthorized_post_request(auth_endpoint, data)
        #print(f"Response is: {res}")
        if res.status_code == 200 and 'authorization' in res.json():
            return res.json().get('authorization')
        else:
            print(f'Error: {res.status_code}')
            print(res.text)  # You'll likely want to see the error message as well
            raise ValueError('Authorization failed')


    def get_access_token(self, auth_token):
        access_endpoint = self.base_url + '/api/v1/oauth/accesstoken'
        data = {
            'authorization': auth_token
        }
        res = self.handle_unauthorized_post_request(access_endpoint, data)
        if res.status_code == 200 and 'accesstoken' in res.json():
            return res.json().get('accesstoken')
        else:
            print(f'Error: {res.status_code}')
            print(res.text)  # You'll likely want to see the error message as well
            raise ValueError('Access token retrieval failed')

    def authorize(self):
        #print('Getting auth token')
        auth_token = self.get_authorization_token()
        #print('Getting auth token completed')

        #print('Getting access token')
        #print(f"Authorization token is {auth_token}")
        self.access_token = self.get_access_token(auth_token)