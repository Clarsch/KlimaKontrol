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
      "hasActiveWarnings": "boolean",
      "warnings": [
        {
          "id": "string",
          "type": "string",
          "message": "string",
          "active": "boolean",
          "timestamp": "date"
        }
      ]
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
  - `timeRange`: "1day" | "1month" | "6months" | "1year"
- **Response:**
  ```json
  [
    {
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
      "type": "string",
      "message": "string",
      "active": "boolean",
      "timestamp": "date",
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
- **Response:**
  ```json
  {
    "recordCount": "number"
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
      "name": "string",
      "locations": ["string"]  // Array of location IDs
    }
  ]
  ```

Note: All endpoints except login require authentication via Bearer token in the Authorization header. 