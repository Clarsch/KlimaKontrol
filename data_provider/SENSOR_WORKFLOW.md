# Sensor Assignment Workflow

## Overview

The data provider service requires **manual assignment** of sensors to prevent false data. New sensors discovered from SensorPush API are stored with `NULL` values for `local_sensor_id` and `location_id` until manually assigned.

## Workflow

### 1. **Initial Setup**
```bash
# Start the service (will discover sensors but not fetch data yet)
pm2 start ecosystem.config.js

# Check service status
pm2 logs data-provider
```

### 2. **Discover New Sensors**
```bash
# Sync sensors from SensorPush API
python manage_sensors.py sync

# List all sensors to see what needs assignment
python manage_sensors.py list
```

### 3. **Assign Sensors**
```bash
# List unassigned sensors
python manage_sensors.py list-unassigned

# Assign each sensor with local ID and location
python manage_sensors.py assign 16938384.41622496812705309768 bov_sensor_001 bov
python manage_sensors.py assign 16938384.41622496812705309769 rise_sensor_001 rise
```

### 4. **Verify Assignment**
```bash
# List all sensors (should show ASSIGNED status)
python manage_sensors.py list

# List sensors for a specific location
python manage_sensors.py list-location bov
```

### 5. **Service Will Now Fetch Data**
Once sensors are assigned, the service will automatically:
- Fetch data from SensorPush API
- Convert and store readings in database
- Upload readings to your KlimaKontrol server

## Example Output

### Unassigned Sensors
```
=== Unassigned Sensors ===
ID   SensorPush ID              Name                 Type       Missing
---- ------------------------- -------------------- ---------- ---------------
1    16938384.4162249681270530  HT1 Sensor          HT1        local_id, location
2    16938384.4162249681270531  Temperature Probe   HT1        local_id, location
```

### After Assignment
```
=== All Sensors ===
ID   SensorPush ID              Local ID            Location       Name                 Type       Status
---- ------------------------- -------------------- --------------- -------------------- ---------- -----------
1    16938384.4162249681270530  bov_sensor_001      bov            HT1 Sensor          HT1        ASSIGNED
2    16938384.4162249681270531  rise_sensor_001     rise           Temperature Probe   HT1        ASSIGNED
```

## Important Notes

1. **No False Data**: Sensors with `NULL` values are never processed
2. **Manual Control**: You decide which sensors to use and where they belong
3. **Data Integrity**: Only properly assigned sensors contribute to your data
4. **Flexible Management**: Can reassign sensors or change locations anytime

## Troubleshooting

### Service Not Fetching Data
- Check if sensors are assigned: `python manage_sensors.py list-unassigned`
- Assign any unassigned sensors
- Check service logs: `pm2 logs data-provider`

### Wrong Location Data
- Update sensor location: `python manage_sensors.py update-location <sensorpush_id> <new_location>`
- Service will use new location for future readings

### New Sensors Not Appearing
- Sync from API: `python manage_sensors.py sync`
- Check SensorPush API connection
- Verify credentials in `config/config.json`
