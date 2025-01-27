import sensorpush_loader.modules.Converter as conv
import sensorpush_loader.modules.Formatter as fm


def observation_to_klimakontrol_reading(observation, location_id:str):
    '''
    input: observation
    {
        "observed": "2025-01-25T22:05:59.000Z",
        "gateways": "jGYtlG1RX45fG+VzAcqakiptyeRWuhr4oqoSNtBSZ9k=",
        "temperature": 72.39,
        "humidity": 44.95,
        "dewpoint": 49.78,
        "barometric_pressure": 29.69,
        "vpd": 1.48,
        "altitude": null,
        "altimeter_pressure": 29.68
    }

    output: 
    {
        "location": location,
        "record_time": testDateTime.strftime("%Y-%m-%dT%H:%M:%S"),
        "temperature": round(temperature, 2),
        "relative_humidity": round(humidity, 2),
        "air_pressure": "1013",
        "pause": "0"
    }
    {
    "location": "bov",
    "record_time": "2025-01-01T08:00:00",
    "temperature": 14.56,
    "relative_humidity": 56.62,
    "air_pressure": "1013",
    "pause": "0"
    }

    '''
    
    record_time = fm.string_to_naive_datetime(observation['observed']).strftime("%Y-%m-%dT%H:%M:%S")
    temp = conv.fahrenheit_to_celsius(observation['temperature'])
    air_pressure = conv.pressure_inhg_to_hpa(observation['barometric_pressure'])

    reading = {
        "location": location_id,
        "record_time": record_time,
        "temperature": temp,
        "relative_humidity": observation['humidity'],
        "air_pressure": air_pressure,
        "pause": "0"
        }

    return reading