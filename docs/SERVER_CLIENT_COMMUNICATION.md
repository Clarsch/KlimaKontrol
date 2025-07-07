# Server-Client Communication Analysis

## Overview

KlimaKontrol is a climate monitoring system for churches with a React frontend and Node.js/Express backend. The system manages environmental data collection, monitoring, and alerting for multiple church locations across different areas.

## Architecture Overview

- **Frontend**: React application with styled-components
- **Backend**: Node.js/Express server with file-based data storage
- **Authentication**: JWT-based with role-based access control
- **Data Storage**: JSON files for configuration and environmental data
- **Communication**: RESTful API with JSON payloads

## API Base Configuration

**Base URL**: Configured via `VITE_API_URL` environment variable
**Default**: Relative path (same domain)
**CORS**: Configured for localhost:5173 and klima-kontrol-five.vercel.app

## Authentication Endpoints

### POST `/api/auth/login`

**Purpose**: User authentication and JWT token generation

**Request Body**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Response**:
```json
{
  "token": "jwt_token_string",
  "user": {
    "username": "string",
    "name": "string", 
    "role": "admin|monitoring|collector",
    "areas": [1, 2, 3, 4],
    "locations": ["location_id1", "location_id2"]
  }
}
```

**Error Response**:
```json
{
  "message": "Invalid credentials"
}
```

## Data Management Endpoints

### GET `/api/data/areas`

**Purpose**: Retrieve all areas with their associated locations

**Response**:
```json
[
  {
    "id": 1,
    "name": "Aabenraa Provsti",
    "locations": [
      {
        "id": "bjolderup",
        "name": "Bjolderup Kirke",
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

### GET `/api/data/locations`

**Purpose**: Retrieve all locations (simplified)

**Response**:
```json
[
  {
    "id": "location_id",
    "name": "Location Name"
  }
]
```

### GET `/api/data/locations/status`

**Purpose**: Get current status of all locations including active warnings

**Response**:
```json
{
  "location_id": {
    "name": "Location Name",
    "hasActiveWarnings": true,
    "warnings": [
      {
        "id": "warning_uuid",
        "locationId": "location_id",
        "type": "Temperature|Humidity|Pressure",
        "message": "Warning description",
        "timestamp": "2024-01-01T12:00:00.000Z",
        "active": true,
        "value": 25.5,
        "threshold": 22
      }
    ],
    "lastUpdate": "2024-01-01T12:00:00.000Z"
  }
}
```

### GET `/api/data/location/:locationId`

**Purpose**: Get detailed information for a specific location

**Response**:
```json
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
```

### PUT `/api/data/location/:locationId/settings`

**Purpose**: Update location settings

**Request Body**:
```json
{
  "settings": {
    "groundTemperature": 15
  }
}
```

**Response**:
```json
{
  "location": "location_id",
  "settings": {
    "groundTemperature": 15
  }
}
```

### PUT `/api/data/location/:locationId/thresholds`

**Purpose**: Update location thresholds

**Request Body**:
```json
{
  "temperature": { "min": 8, "max": 22 },
  "humidity": { "min": 45, "max": 65 },
  "pressure": { "min": 950, "max": 1040 }
}
```

**Response**:
```json
{
  "location": "location_id",
  "thresholds": {
    "temperature": { "min": 8, "max": 22 },
    "humidity": { "min": 45, "max": 65 },
    "pressure": { "min": 950, "max": 1040 }
  }
}
```

### GET `/api/data/environmental/:locationId`

**Purpose**: Get environmental data for a location with time filtering

**Query Parameters**:
- `timeRange`: "1day" | "1month" | "6months" | "1year" | "2years"

**Response**:
```json
[
  {
    "record_time": "2024-01-01T12:00:00.000Z",
    "temperature": 20.5,
    "relative_humidity": 55.2,
    "air_pressure": 1013.25
  }
]
```

### GET `/api/data/warnings/:locationId`

**Purpose**: Get warnings for a specific location

**Response**:
```json
[
  {
    "id": "warning_uuid",
    "locationId": "location_id",
    "type": "Temperature|Humidity|Pressure",
    "message": "Temperature too high: 25°C (max: 22°C)",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "active": true,
    "value": 25.0,
    "threshold": 22
  }
]
```

### GET `/api/data/warnings/active`

**Purpose**: Get all active warnings across all locations

**Response**:
```json
[
  {
    "id": "warning_uuid",
    "locationId": "location_id",
    "type": "Temperature",
    "message": "Temperature too high: 25°C (max: 22°C)",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "active": true,
    "value": 25.0,
    "threshold": 22
  }
]
```

### PATCH `/api/data/warnings/:warningId/deactivate`

**Purpose**: Deactivate a specific warning

**Request Body**:
```json
{
  "userId": "username"
}
```

**Response**:
```json
{
  "success": true
}
```

## Data Upload Endpoints

### POST `/api/data/upload`

**Purpose**: Upload CSV file with environmental data

**Request**: Multipart form data
- `file`: CSV file
- `location`: Location ID

**CSV Format**:
```csv
record_time,temperature,relative_humidity,air_pressure
2024-01-01T12:00:00.000Z,20.5,55.2,1013.25
```

**Response**:
```json
{
  "message": "File uploaded and processed successfully",
  "recordCount": 100,
  "newWarnings": 5
}
```

**Error Response**:
```json
{
  "message": "Invalid data in CSV file",
  "errors": [
    "Row 1: Invalid temperature: 999",
    "Row 2: Invalid humidity: 150"
  ]
}
```

### POST `/api/data/reading/dataReading`

**Purpose**: Submit single data reading (alternative to file upload)

**Request Body**:
```json
{
  "location": "location_id",
  "record_time": "2024-01-01T12:00:00.000Z",
  "temperature": 20.5,
  "relative_humidity": 55.2,
  "air_pressure": 1013.25
}
```

**Response**:
```json
{
  "message": "Data reading processed successfully"
}
```

## Data Structures

### User Configuration
```javascript
{
  username: "string",
  name: "string", 
  password: "string",
  role: "admin|monitoring|collector",
  areas: [1, 2, 3, 4],
  locations: ["location_id1", "location_id2"]
}
```

### Location Configuration
```javascript
{
  id: "location_id",
  name: "Location Name",
  settings: {
    groundTemperature: 15
  },
  thresholds: {
    temperature: { min: 8, max: 22 },
    humidity: { min: 45, max: 65 },
    pressure: { min: 950, max: 1040 }
  }
}
```

### Environmental Data Record
```javascript
{
  record_time: "2024-01-01T12:00:00.000Z",
  temperature: 20.5,
  relative_humidity: 55.2,
  air_pressure: 1013.25
}
```

### Warning Object
```javascript
{
  id: "uuid",
  locationId: "location_id",
  type: "Temperature|Humidity|Pressure",
  message: "Warning description",
  timestamp: "2024-01-01T12:00:00.000Z",
  active: true,
  value: 25.5,
  threshold: 22,
  deactivatedBy: "username", // Optional
  deactivatedAt: "2024-01-01T13:00:00.000Z" // Optional
}
```

### Area Configuration
```javascript
{
  id: 1,
  name: "Area Name",
  locations: ["location_id1", "location_id2"]
}
```

## Client-Side API Integration

### Axios Configuration
```javascript
// client/src/api/axiosConfig.js
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
});
```

### Authentication Context
```javascript
// client/src/contexts/AuthContext.jsx
const login = (user, token) => {
  setUser(user);
  setToken(token);
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};
```

## Data Validation Rules

### Environmental Data Validation
- **Temperature**: -50°C to 50°C
- **Humidity**: 0% to 100%
- **Pressure**: 900 hPa to 1100 hPa
- **Date Format**: ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)

### File Upload Limits
- **File Size**: 5MB maximum
- **File Type**: CSV only
- **Required Columns**: record_time, temperature, relative_humidity, air_pressure

## Error Handling

### Standard Error Response Format
```json
{
  "message": "Error description",
  "error": "Detailed error information (development only)"
}
```

### Common HTTP Status Codes
- **200**: Success
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (authentication required)
- **404**: Not Found
- **500**: Internal Server Error

## Security Considerations

### CORS Configuration
- Allowed origins: localhost:5173, klima-kontrol-five.vercel.app
- Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
- Credentials: false

### Authentication
- JWT tokens with 24-hour expiration
- Role-based access control (admin, monitoring, collector)
- User-specific location access restrictions

### Data Validation
- Server-side validation of all input data
- File type and size restrictions
- Data range validation for environmental readings

## File Storage Structure

```
server/
├── data/
│   ├── warnings/
│   │   └── warnings.json
│   ├── environmental/
│   │   ├── location1.json
│   │   └── location2.json
│   └── location_id/
│       └── data_timestamp.csv
```

## Real-time Updates

The system uses polling for real-time updates:
- Location status refresh: Every 5 seconds
- Dashboard data refresh: On component mount and user interaction

## Performance Considerations

- File-based storage for simplicity
- JSON data structures for easy parsing
- Polling-based updates (not WebSocket)
- Client-side caching of configuration data
- Pagination not implemented (all data loaded at once) 