const crypto = require('crypto');

const processData = (records, locationId, thresholds) => {
    const warnings = [];
    
    records.forEach(record => {
        const temp = parseFloat(record.temperature);
        const humidity = parseFloat(record.relative_humidity);
        const pressure = parseFloat(record.air_pressure);

        // Temperature warnings
        if (temp < thresholds.temperature.min || temp > thresholds.temperature.max) {
            warnings.push({
                id: crypto.randomUUID(),
                locationId,
                type: 'Temperature',
                message: temp < thresholds.temperature.min 
                    ? `Temperature too low: ${temp}°C (min: ${thresholds.temperature.min}°C)`
                    : `Temperature too high: ${temp}°C (max: ${thresholds.temperature.max}°C)`,
                timestamp: record.record_time,
                active: true,
                value: temp,
                threshold: temp < thresholds.temperature.min 
                    ? thresholds.temperature.min 
                    : thresholds.temperature.max
            });
        }

        // Humidity warnings
        if (humidity < thresholds.humidity.min || humidity > thresholds.humidity.max) {
            warnings.push({
                id: crypto.randomUUID(),
                locationId,
                type: 'Humidity',
                message: humidity < thresholds.humidity.min
                    ? `Humidity too low: ${humidity}% (min: ${thresholds.humidity.min}%)`
                    : `Humidity too high: ${humidity}% (max: ${thresholds.humidity.max}%)`,
                timestamp: record.record_time,
                active: true,
                value: humidity,
                threshold: humidity < thresholds.humidity.min
                    ? thresholds.humidity.min
                    : thresholds.humidity.max
            });
        }

        // Pressure warnings
        if (pressure < thresholds.pressure.min || pressure > thresholds.pressure.max) {
            warnings.push({
                id: crypto.randomUUID(),
                locationId,
                type: 'Pressure',
                message: pressure < thresholds.pressure.min
                    ? `Pressure too low: ${pressure}hPa (min: ${thresholds.pressure.min}hPa)`
                    : `Pressure too high: ${pressure}hPa (max: ${thresholds.pressure.max}hPa)`,
                timestamp: record.record_time,
                active: true,
                value: pressure,
                threshold: pressure < thresholds.pressure.min
                    ? thresholds.pressure.min
                    : thresholds.pressure.max
            });
        }
    });

    return warnings;
};

module.exports = { processData }; 