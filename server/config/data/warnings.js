const warnings = [];

// Warning types
const WARNING_TYPES = {
    TEMPERATURE_HIGH: 'Temperature High',
    TEMPERATURE_LOW: 'Temperature Low',
    HUMIDITY_HIGH: 'Humidity High',
    HUMIDITY_LOW: 'Humidity Low',
    PRESSURE_HIGH: 'Pressure High',
    PRESSURE_LOW: 'Pressure Low'
};

// Function to create a new warning
const createWarning = (locationId, type, message, value, threshold) => {
    return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        locationId,
        type,
        message,
        value,
        threshold,
        timestamp: new Date(),
        active: true,
        deactivatedBy: null,
        deactivatedAt: null
    };
};

// Function to check thresholds and create warnings
const checkThresholds = (locationId, data, thresholds) => {
    const newWarnings = [];

    // Check temperature
    if (data.temperature > thresholds.temperature.max) {
        newWarnings.push(createWarning(
            locationId,
            WARNING_TYPES.TEMPERATURE_HIGH,
            `Temperature (${data.temperature}°C) exceeded maximum threshold (${thresholds.temperature.max}°C)`,
            data.temperature,
            thresholds.temperature.max
        ));
    }
    if (data.temperature < thresholds.temperature.min) {
        newWarnings.push(createWarning(
            locationId,
            WARNING_TYPES.TEMPERATURE_LOW,
            `Temperature (${data.temperature}°C) below minimum threshold (${thresholds.temperature.min}°C)`,
            data.temperature,
            thresholds.temperature.min
        ));
    }

    // Check humidity
    if (data.relative_humidity > thresholds.humidity.max) {
        newWarnings.push(createWarning(
            locationId,
            WARNING_TYPES.HUMIDITY_HIGH,
            `Humidity (${data.relative_humidity}%) exceeded maximum threshold (${thresholds.humidity.max}%)`,
            data.relative_humidity,
            thresholds.humidity.max
        ));
    }
    if (data.relative_humidity < thresholds.humidity.min) {
        newWarnings.push(createWarning(
            locationId,
            WARNING_TYPES.HUMIDITY_LOW,
            `Humidity (${data.relative_humidity}%) below minimum threshold (${thresholds.humidity.min}%)`,
            data.relative_humidity,
            thresholds.humidity.min
        ));
    }

    return newWarnings;
};

// Function to get warnings for a location
const getWarningsForLocation = (locationId) => {
    return warnings.filter(warning => warning.locationId === locationId);
};

// Function to deactivate a warning
const deactivateWarning = (warningId, userId) => {
    const warning = warnings.find(w => w.id === warningId);
    if (warning) {
        warning.active = false;
        warning.deactivatedBy = userId;
        warning.deactivatedAt = new Date();
        return true;
    }
    return false;
};

module.exports = {
    warnings,
    checkThresholds,
    getWarningsForLocation,
    deactivateWarning,
    WARNING_TYPES
}; 