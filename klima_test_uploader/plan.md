


- get something that can communicate with the backend
- get something that will send in realistic data -+ a bit for every data send in
- controler for me to decide if if should break threshold
- management of multiple "locations"
- multiple sensors for a location
- registration of a new sensor


location Name/Id
sensor Name/Id
dateTime / Timestamp
data 
    Temperature
    Humidity
    Pressure




# Uploading Tester for KlimaKontrol

## Data Format

The KlimaKontol app API should accept data in the following format from the sensors.

```json
{
  "location": { //Maybe not needed? Just lookup where the sensor is paired to?
    "name": "Location Name", //Human readable
    "id": "Location ID" //UUID
  },
  "sensor": {
    "name": "Sensor Name", //Human readable
    "id": "Sensor ID", //UUID
    "battery_level": "battery percentage" 
  },
  "dateTime": "YYYY-MM-DDTHH:MM:SSZ", //Date and time for the reading
  "data": {
    "temperature": "Value in Celsius", //Float
    "humidity": "Value in percentage", //Float
    "pressure": "Value in hPa" //Float
  }
}
```