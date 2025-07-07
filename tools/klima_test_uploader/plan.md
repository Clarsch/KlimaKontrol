


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
  "sensor_id": "sensor_001", //Required: Unique sensor identifier
  "location_id": "location_id", //Required: Location where sensor is deployed
  "record_time": "YYYY-MM-DDTHH:MM:SSZ", //Date and time for the reading
  "temperature": 20.5, //Value in Celsius (Float)
  "relative_humidity": 55.2, //Value in percentage (Float)
  "air_pressure": 1013.25 //Value in hPa (Float)
}
```

**Note:** The server will automatically add a UUID (`id`) to each record. The `sensor_id` and `location_id` are required fields for all data submissions.