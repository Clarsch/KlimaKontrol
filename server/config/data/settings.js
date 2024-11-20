// Get all locations from areas
const areas = require('./areas');
const allLocations = Object.values(areas).flat();

// Create default settings for all locations
const locationSettings = allLocations.reduce((acc, location) => {
  acc[location] = { 
    groundTemperature: 15,
    thresholds: {
      temperature: { min: 2, max: 22 },
      humidity: { min: 45, max: 65 },
      pressure: { min: 960, max: 1040 }
    }
  };
  return acc;
}, {});

module.exports = locationSettings; 