import requests
import time


backend_url = "http://localhost:5001"
data_url = backend_url + "/api/data"
location = "bov"
data_location_status = "/locations/status"
data_location_details_url = data_url + "/location/" + location
data_readings_url = data_url + "/reading/dataReading"

json_data = {
    "sensor": {
        "id": "sensor-id-001",
        "name": "bov-entrance"
    },
    "dateTime": "2025-01-19T12:00:00Z",
    "data": {
        "temperature": 21.5,
        "humidity": 65.0,
        "pressure": 1013.25
    }
}


def postLocationDataReading():

    #response1 = requests.get(data_url+"/locations/status")
    #response = requests.get(data_location_details_url)
    #print(str(response.json))
    #print(str(response.content))

    json_data = {
        "sensor": {
            "id": "sensor-id-001",
            "name": "bov-entrance"
        },
        "dateTime": "2025-01-19T12:00:00Z",
        "data": {
            "temperature": 21.5,
            "humidity": 65.0,
            "pressure": 1013.25
        }
    }


    while True:

        try:
            response = requests.post(data_readings_url, json=json_data)
            response.raise_for_status()
            print("Posting data reading is completed!")

        except requests.exceptions.RequestException as e:
            # Handle any errors that occur during the request
            print("An error occurred:", e)

        time.sleep(5)

#    response2 = requests.get(backend_url+"/areas")
 #   print(str(response2.json))



postLocationDataReading()

