# Frontend Team: Sensor Name Implementation

## 📋 **Overview**

The environmental data structure now supports sensor names provided directly by the data uploader. The server stores whatever sensor information is provided in the upload, making it flexible and dynamic.

## 🔄 **Data Structure Changes**

### **Before (Old Structure)**
```json
{
  "air_pressure": null,
  "id": 1000,
  "location_id": "ensted",
  "pause": 0,
  "record_time": "2025-10-01T00:10:22Z",
  "relative_humidity": 64.28,
  "sensor_id": "456378.880007615583691155",
  "temperature": 18.11111111
}
```

### **After (New Structure)**
```json
{
  "air_pressure": null,
  "id": 1000,
  "location_id": "ensted",
  "pause": 0,
  "record_time": "2025-10-01T00:10:22Z",
  "relative_humidity": 64.28,
  "sensor_id": "456378.880007615583691155",
  "sensor_name": "Ensted Main Sensor",
  "temperature": 18.11111111
}
```

## 🆕 **New Field**

- **Field Name**: `sensor_name`
- **Type**: `string`
- **Description**: Human-readable name for the sensor (provided by data uploader)
- **Example**: `"Ensted Main Sensor"`
- **Source**: Comes directly from the data uploader - no server-side mapping required

## 📤 **Data Upload Format**

The data uploader should include `sensor_name` in their uploads:

### **Single Reading Upload**
```json
{
  "sensor_id": "456378.880007615583691155",
  "sensor_name": "Ensted Main Sensor",
  "location_id": "ensted",
  "record_time": "2025-10-01T00:10:22Z",
  "temperature": 18.11111111,
  "relative_humidity": 64.28,
  "air_pressure": null,
  "pause": 0
}
```

### **Batch Upload**
```json
{
  "readings": [
    {
      "sensor_id": "456378.880007615583691155",
      "sensor_name": "Ensted Main Sensor",
      "location_id": "ensted",
      "record_time": "2025-10-01T00:10:22Z",
      "temperature": 18.11111111,
      "relative_humidity": 64.28,
      "air_pressure": null,
      "pause": 0
    }
  ],
  "batch_id": "batch_001",
  "timestamp": "2025-10-01T00:10:22Z"
}
```

## 🎨 **Frontend Implementation Guide**

### **1. Display Sensor Names**

Show sensor names when available, fallback to sensor ID:

```javascript
// Display sensor name with fallback
<div>Sensor: {reading.sensor_name || reading.sensor_id}</div>
```

### **2. Data Tables**

Update your data tables to show sensor names:

```javascript
const columns = [
  { key: 'record_time', label: 'Time' },
  { key: 'sensor_name', label: 'Sensor' }, // New column
  { key: 'temperature', label: 'Temperature' },
  { key: 'relative_humidity', label: 'Humidity' },
  { key: 'air_pressure', label: 'Pressure' }
];

// In your table rendering
<td>{reading.sensor_name || reading.sensor_id}</td>
```

### **3. Filtering and Search**

Enable filtering by sensor name:

```javascript
// Filter readings by sensor name or ID
const filteredReadings = readings.filter(reading => {
  const searchTerm = searchTerm.toLowerCase();
  return (
    reading.sensor_name?.toLowerCase().includes(searchTerm) ||
    reading.sensor_id.toLowerCase().includes(searchTerm)
  );
});
```

### **4. Charts and Graphs**

Use sensor names in chart legends:

```javascript
// Chart configuration
const chartData = readings.map(reading => ({
  x: reading.record_time,
  y: reading.temperature,
  sensor: reading.sensor_name || reading.sensor_id // Use name with fallback
}));
```

### **5. Sensor Selection**

Create sensor selection based on available data:

```javascript
// Get unique sensors from current data
const uniqueSensors = [...new Set(readings.map(r => ({
  id: r.sensor_id,
  name: r.sensor_name || r.sensor_id
})))];

// Create dropdown options
const sensorOptions = uniqueSensors.map(sensor => ({
  value: sensor.id,
  label: sensor.name
}));
```

## 🔄 **Migration Strategy**

### **Backward Compatibility**
- All existing data will continue to work
- New uploads can include `sensor_name` field
- Frontend should handle both cases gracefully

### **Gradual Rollout**
1. **Phase 1**: Update frontend to display `sensor_name` when available
2. **Phase 2**: Data uploader starts including `sensor_name` in uploads
3. **Phase 3**: Frontend fully utilizes sensor names for better UX

## 📝 **Data Uploader Requirements**

### **Required Fields**
- `sensor_id` (string) - Unique sensor identifier
- `location_id` (string) - Location where sensor is deployed
- `record_time` (ISO string) - Timestamp of the reading
- `temperature` (number) - Temperature reading
- `relative_humidity` (number) - Humidity reading
- `air_pressure` (number or null) - Pressure reading
- `pause` (number) - Pause indicator

### **Optional Fields**
- `sensor_name` (string) - Human-readable sensor name

### **Example Upload**
```python
# Python example for data uploader
import requests

reading = {
    "sensor_id": "456378.880007615583691155",
    "sensor_name": "Ensted Main Sensor",  # Optional but recommended
    "location_id": "ensted",
    "record_time": "2025-10-01T00:10:22Z",
    "temperature": 18.11111111,
    "relative_humidity": 64.28,
    "air_pressure": None,
    "pause": 0
}

response = requests.post(
    'http://localhost:5001/api/data/reading/dataReading',
    headers={'Authorization': f'Bearer {token}'},
    json=reading
)
```

## 🧪 **Testing**

### **Test Data Structure**
Verify that readings include sensor names when provided:

```javascript
// Test API response
const response = await fetch('/api/data/location/ensted');
const data = await response.json();

// Check that sensor_name is present when provided
data.environmentalData.forEach(reading => {
  if (reading.sensor_name) {
    console.log(`Sensor: ${reading.sensor_name} (${reading.sensor_id})`);
  } else {
    console.log(`Sensor: ${reading.sensor_id} (no name provided)`);
  }
});
```

## 🚀 **Implementation Checklist**

- [ ] Update data display components to show `sensor_name` when available
- [ ] Add fallback to `sensor_id` if `sensor_name` is missing
- [ ] Update filtering and search to include sensor names
- [ ] Modify charts and graphs to use sensor names with fallback
- [ ] Test with both old data (no sensor_name) and new data (with sensor_name)
- [ ] Update data uploader to include `sensor_name` field
- [ ] Verify backward compatibility with existing data

## 📞 **Support**

If you encounter any issues:
1. Check that the data uploader is including `sensor_name` in uploads
2. Verify API responses include `sensor_name` field when provided
3. Ensure fallback logic works for missing sensor names
4. Contact the data uploader team to include sensor names in their uploads

---

**Note**: This implementation is flexible and dynamic. The server doesn't need to know about sensors beforehand - it simply stores whatever sensor information is provided by the data uploader. This makes the system more maintainable and allows for easy addition of new sensors without server configuration changes.
