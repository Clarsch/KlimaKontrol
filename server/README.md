# Server API Documentation

## Authentication Endpoints

### Login
- **URL:** `/api/auth/login`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Response:**
  ```json
  {
    "user": {
      "id": "string",
      "username": "string",
      "name": "string",
      "role": "string",
      "locations": ["string"]
    },
    "token": "string"
  }
  ```

## Location Endpoints

### Get All Locations
- **URL:** `/api/data/locations`
- **Method:** `GET`
- **Response:**
  ```json
  [
    {
      "id": "string",
      "name": "string",
      "settings": {
        "groundTemperature": "number"
      },
      "thresholds": {
        "temperature": { "min": "number", "max": "number" },
        "humidity": { "min": "number", "max": "number" },
        "pressure": { "min": "number", "max": "number" }
      },
      "warnings": [],
      "status": "string",
      "lastUpdate": "date",
      "environmentalData": []
    }
  ]
  ```

### Get Location by ID
- **URL:** `/api/data/location/:id`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "id": "string",
    "name": "string",
    "settings": {
      "groundTemperature": "number"
    },
    "thresholds": {
      "temperature": { "min": "number", "max": "number" },
      "humidity": { "min": "number", "max": "number" },
      "pressure": { "min": "number", "max": "number" }
    },
    "warnings": [],
    "status": "string",
    "lastUpdate": "date",
    "environmentalData": []
  }
  ```

### Get Location Status
- **URL:** `/api/data/locations/status`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "locationId": {
      "name": "Location Name",
      "hasActiveWarnings": "boolean",
      "warnings": [
        {
          "id": "string",
          "location_id": "location_id",
          "type": "string",
          "message": "string",
          "active": "boolean",
          "timestamp": "date",
          "value": "number",
          "threshold": "number"
        }
      ],
      "lastUpdate": "date"
    }
  }
  ```

### Update Location Settings
- **URL:** `/api/data/location/:id/settings`
- **Method:** `PUT`
- **Body:**
  ```json
  {
    "settings": {
      "groundTemperature": "number"
    }
  }
  ```

### Update Location Thresholds
- **URL:** `/api/locations/:id/thresholds`
- **Method:** `PUT`
- **Body:**
  ```json
  {
    "temperature": { "min": "number", "max": "number" },
    "humidity": { "min": "number", "max": "number" },
    "pressure": { "min": "number", "max": "number" }
  }
  ```

## Environmental Data Endpoints

### Get Environmental Data
- **URL:** `/api/data/environmental/:locationId`
- **Method:** `GET`
- **Query Parameters:**
  - `timeRange`: "1day" | "1month" | "6months" | "1year" | "2years"
- **Response:**
  ```json
  [
    {
      "id": "uuid-generated-on-server",
      "sensor_id": "sensor_001",
      "location_id": "location_id",
      "record_time": "date",
      "temperature": "number",
      "relative_humidity": "number",
      "air_pressure": "number"
    }
  ]
  ```

## Warning Endpoints

### Get Location Warnings
- **URL:** `/api/data/warnings/:locationId`
- **Method:** `GET`
- **Response:**
  ```json
  [
    {
      "id": "string",
      "location_id": "location_id",
      "type": "string",
      "message": "string",
      "active": "boolean",
      "timestamp": "date",
      "value": "number",
      "threshold": "number",
      "deactivatedBy": "string",
      "deactivatedAt": "date"
    }
  ]
  ```

### Deactivate Warning
- **URL:** `/api/data/warnings/:warningId/deactivate`
- **Method:** `PATCH`
- **Body:**
  ```json
  {
    "userId": "string"
  }
  ```

## Data Upload Endpoint

### Upload Environmental Data
- **URL:** `/api/data/upload`
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Form Fields:**
  - `file`: CSV file
  - `location`: Location ID
- **CSV Format:**
  ```csv
  sensor_id,record_time,temperature,relative_humidity,air_pressure
  sensor_001,2024-01-01T12:00:00.000Z,20.5,55.2,1013.25
  ```
- **Response:**
  ```json
  {
    "message": "File uploaded and processed successfully",
    "recordCount": "number",
    "newWarnings": "number"
  }
  ```

## Data Reading Endpoint

### Submit Single Data Reading
- **URL:** `/api/data/reading/dataReading`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "sensor_id": "sensor_001",
    "location_id": "location_id",
    "record_time": "2024-01-01T12:00:00.000Z",
    "temperature": 20.5,
    "relative_humidity": 55.2,
    "air_pressure": 1013.25
  }
  ```
- **Response:**
  ```json
  {
    "message": "Data reading processed successfully"
  }
  ```

## Area Endpoints

### Get All Areas
- **URL:** `/api/data/areas`
- **Method:** `GET`
- **Response:**
  ```json
  [
    {
      "id": 1,
      "name": "Area Name",
      "locations": [
        {
          "id": "location_id",
          "name": "Location Name",
          "settings": {
            "groundTemperature": 15
          },
          "thresholds": {
            "temperature": { "min": 8, "max": 22 },
            "humidity": { "min": 45, "max": 65 },
            "pressure": { "min": 950, "max": 1040 }
          }
        }
      ]
    }
  ]
  ```
  ]
  ```

Note: All endpoints except login require authentication via Bearer token in the Authorization header. 