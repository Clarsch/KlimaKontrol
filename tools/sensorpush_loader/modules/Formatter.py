import json
from datetime import datetime
import hashlib

def prettify_json(input_data: str):
    pretty_json = json.dumps(input_data, indent=4)
    return(pretty_json)


def datetime_to_utc_format(datetime: datetime):
    return datetime.strftime('%Y-%m-%dT%H:%M:%S.000Z')


def string_to_utc_datetime(date_string:str):
    input_string_corrected = date_string.replace('000Z', '+00:00')
    return datetime.fromisoformat(input_string_corrected)

def string_to_naive_datetime(date_string:str):
    utc_formatted = string_to_utc_datetime(date_string)
    return utc_formatted.replace(tzinfo=None)


def get_hash_id_from_string(input_string):
    encoded_string = input_string.encode('utf-8')
    hash_object = hashlib.sha256(encoded_string)
    return hash_object.hexdigest()