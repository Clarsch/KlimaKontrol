// Get all locations from areas
const areas = require('./areas');
const allLocations = Object.values(areas).flat();

// Create empty warnings for all locations
const warnings = allLocations.reduce((acc, location) => {
  acc[location] = [];
  return acc;
}, {});

module.exports = warnings; 