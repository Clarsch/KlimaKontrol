const fs = require('fs').promises;
const { validateConfig } = require('../utils/configValidation');

const validateConfigFiles = async () => {
  try {
    // Validate locations config
    const locationsConfig = require('../config/data/locations.js');
    locationsConfig.forEach(location => {
      validateConfig(location);
    });

    // Validate areas config
    const areasConfig = require('../config/data/areas.js');
    // Add areas validation logic here

    return true;
  } catch (error) {
    console.error('Config validation failed:', error);
    return false;
  }
};

module.exports = { validateConfigFiles }; 