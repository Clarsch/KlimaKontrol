const processData = (records, locationId, thresholds) => {
    const warnings = [];
    
    records.forEach(record => {
        const temp = parseFloat(record.temperature);
        const humidity = parseFloat(record.relative_humidity);
        const pressure = parseFloat(record.air_pressure);

        // Check temperature thresholds
        if (temp < thresholds.temperature.min) {
            warnings.push({
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                locationId,
                type: 'Temperature',
                message: `Temperature too low: ${temp}°C (min: ${thresholds.temperature.min}°C)`,
                timestamp: record.record_time,
                active: true
            });
        } else if (temp > thresholds.temperature.max) {
            warnings.push({
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                locationId,
                type: 'Temperature',
                message: `Temperature too high: ${temp}°C (max: ${thresholds.temperature.max}°C)`,
                timestamp: record.record_time,
                active: true
            });
        }

        // Check humidity thresholds
        if (humidity < thresholds.humidity.min) {
            warnings.push({
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                locationId,
                type: 'Humidity',
                message: `Humidity too low: ${humidity}% (min: ${thresholds.humidity.min}%)`,
                timestamp: record.record_time,
                active: true
            });
        } else if (humidity > thresholds.humidity.max) {
            warnings.push({
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                locationId,
                type: 'Humidity',
                message: `Humidity too high: ${humidity}% (max: ${thresholds.humidity.max}%)`,
                timestamp: record.record_time,
                active: true
            });
        }

        // Check pressure thresholds
        if (pressure < thresholds.pressure.min) {
            warnings.push({
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                locationId,
                type: 'Pressure',
                message: `Pressure too low: ${pressure}hPa (min: ${thresholds.pressure.min}hPa)`,
                timestamp: record.record_time,
                active: true
            });
        } else if (pressure > thresholds.pressure.max) {
            warnings.push({
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                locationId,
                type: 'Pressure',
                message: `Pressure too high: ${pressure}hPa (max: ${thresholds.pressure.max}hPa)`,
                timestamp: record.record_time,
                active: true
            });
        }
    });

    return warnings;
};

module.exports = { processData }; 