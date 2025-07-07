# The Klima Test Uploader

## Description
This is a small python script which is able to mock a sensor and send climate readings for a location. 
It has three starting values:
- temperature = 15.0 degrees
- humidity = 60.0 %
- testDateTime = 01 january 2025

Both temperature and humidity will be a random factor added or subtracted the latests value, to simulate changes in the values.
For simulating multiple sensors, run sensor simulation in multiple scripts.

**Note:** The current implementation requires sensor_id and location_id in data readings. Ensure your test data includes these fields.

## Running the script

Install Python virtual env if not already installed:
```
python -m venv venv
.\venv\Scripts\activate
pip install -r .\requirements.txt
```

If Python virtual env is installed, start the virtual env:
```
.\venv\Scripts\activate
```

Inside the virtual env, start the script:
```
python .\klima_testing_tool.py
```

Closing the virtual env
```
deactivate
```

## Options in the script

It has to functions:
- sensor -> Simulating a sensor
- resetData -> resetting data for all locations





