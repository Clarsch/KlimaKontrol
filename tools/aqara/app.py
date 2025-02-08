import secrets
from datetime import datetime
import hashlib
import requests

url = 'https://open-ger.aqara.com/v3.0/open/api'

_kk_config = {
    "account": 'klimakontrol6200@gmail.com',
    "app_id": '13368366119023861766bfc4',
    "app_key": 'hwcwdq6qrrv9lo2jg07jmbwlqbk85bl6',
    "key_id": 'K.1336836611986272256'
}
_demo = {
    "account": '189000123456',
    #"account": 'klimakontrol6200@gmail.com',
    "app_id": '13368323358010695680bdfc',
    "app_key": 'hytsd4dr000umlyzjptk2e9zvap1096s',
    "key_id": 'K.1336832336170168320'
}

config = _demo


def md5_32(source_str):
    try:
        # Encode the input string to bytes
        source_bytes = source_str.encode('utf-8')

        # Create an MD5 hash object
        m = hashlib.md5()

        # Update the hash object with the byte array
        m.update(source_bytes)

        # Get the hexadecimal representation of the digest
        result = m.hexdigest()

        return result
    except Exception as e:
        print(f"An error occurred: {e}")
        raise e  # Re-raise the exception if needed

def createSign(access_token:str, app_id:str, key_id:str, nonce:str, time:str, app_key:str):
    sb: str = ""
    if access_token : 
        sb += "AccessToken=" + access_token + "&"
    sb += "Appid=" + app_id + "&" + "Keyid=" + key_id + "&" + "Nonce=" + nonce + "&" + "Time=" + str(time) + app_key
    

    try :
        return md5_32(sb.lower())
    except Exception as e:
        print(f"An error occurred: {e}")
    return None


def getAuthCode():

    #Config values
    account = config["account"]
    appid = config["app_id"]
    appkey = config["app_key"]
    keyid = config["key_id"]

    nonce = appid[-4:] + str(int(datetime.now().timestamp())) 
    time = str(int(datetime.now().timestamp()*1000))
    sign = createSign("", appid, keyid, nonce, time, appkey)
    
    req_headers = {
        'Content-Type': 'application/json',
        "appid": appid,
        "keyid": keyid,
        "nonce": nonce,
        "time": time,
        "sign": sign
    }
    
    print(f"Headers: {req_headers}")

    req_params = {
        "intent": "config.auth.getAuthCode",
        "data": {
            "account": account,
            "accountType": 0,
            "accessTokenValidity": "1h",
            "Appid": '13368366119023861766bfc4',
        }
    }
    print(f"Params: {req_params}")


    resp = requests.post(url, headers= req_headers, data= req_params, json= req_params, params= req_params ) 
    
    if resp.status_code == 200:
        print("Request Succeeded")
        print(f"Response is: {resp.json()}" )
    else: 
        print(f"Error code: {resp.status_code}")
        print(f"Error msg: {resp.content}")

def main():

    getAuthCode()





main()


