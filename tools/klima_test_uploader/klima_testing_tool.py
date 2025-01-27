import requests
import time
import random
from datetime import datetime, timedelta
import os
import json

backend_url = "http://localhost:5001"
data_url = backend_url + "/api/data"
data_location_status = data_url + "/locations/status"

def post_data_observation(observation):
    data_readings_url = data_url + "/reading/dataReading"

    try:
        response = requests.post(data_readings_url, json=observation)
        response.raise_for_status()
        print("Posting data reading is completed!")

    except requests.exceptions.RequestException as e:
        # Handle any errors that occur during the request
        print("An error occurred:", e)


def prettify_json(input_data: str):
    pretty_json = json.dumps(input_data, indent=4)
    return(pretty_json)
        
def post_random_location_data_readings(location, intervalInSeconds, dateIntervalsInHours):
    temperature = 15.0
    humidity = 60.0
    testDateTime = datetime(2025, 1, 1, 0, 0, 0)

    while True:

        if temperature > 25:
            temperature -= 1
        elif temperature < 4:
            temperature += 1
        else :
            temperature += random.uniform(-2.0, 2.0)
        
        if humidity > 85:
            humidity -= 2
        elif humidity < 35:
            humidity += 2
        else :
            humidity += random.uniform(-4.0, 4.0)

        testDateTime = testDateTime + timedelta(hours=dateIntervalsInHours)

        observation_json = {
            "location": location,
            "record_time": testDateTime.strftime("%Y-%m-%dT%H:%M:%S"),
            "temperature": round(temperature, 2),
            "relative_humidity": round(humidity, 2),
            "air_pressure": "1013",
            "pause": "0"
        }
        print(prettify_json(observation_json))

        post_data_observation(observation_json)


        time.sleep(intervalInSeconds)


def deleteFilesInLocation(path):
    if os.path.exists(path):
        for filename in os.listdir(path):
            file_path = os.path.join(path, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
                print(f"Deleted {file_path}")
    else:
        print("The specified directory does not exist.")

def resetLocationsData():
    envPath = r"C:\Users\Chris\projects\klima\KlimaKontrol\server\data\environmental"
    deleteFilesInLocation(envPath)
    uploadsPath = r"C:\Users\Chris\projects\klima\KlimaKontrol\server\data\uploads"
    deleteFilesInLocation(uploadsPath)
    warningsPath = r"C:\Users\Chris\projects\klima\KlimaKontrol\server\data\warnings"
    deleteFilesInLocation(warningsPath)

def main():
    while True:
        action = input("Choose action from (sensor, resetData): ").strip()

        if action == "sensor":
            location = input("Enter location Id:").strip()
            triggerInterval = input("Enter trigger inteval in seconds:").strip()
            dateInterval = input("Enter date interval in hours:").strip()
            post_random_location_data_readings(location, int(triggerInterval), int(dateInterval))

        if action == "resetData":
            resetLocationsData()
            print("Data has been reset.")


if __name__ == "__main__":
    main()
