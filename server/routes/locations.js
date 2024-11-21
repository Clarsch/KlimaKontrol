const express = require('express');
const router = express.Router();
const locations = require('../config/data/locations.js');
const { validateLocationUpdate } = require('../middleware/validation');
const { validateConfig } = require('../utils/configValidation');
const fs = require('fs').promises;
const path = require('path');

// Get all locations from config
router.get('/locations', (req, res) => {
  try {
    // Map the locations from config to include all necessary properties
    const locationsList = locations.map(location => ({
      id: location.id,
      name: location.name,
      settings: location.settings || {
        groundTemperature: 15  // Default value
      },
      thresholds: location.thresholds || {
        temperature: { min: -20, max: 30 },
        humidity: { min: 30, max: 70 },
        pressure: { min: 980, max: 1030 }
      },
      warnings: location.warnings || [],
      status: location.status || 'ok',
      lastUpdate: location.lastUpdate || null,
      environmentalData: location.environmentalData || []
    }));

    res.json(locationsList);
  } catch (error) {
    console.error('Error fetching locations from config:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// Get specific location by ID
router.get('/location/:id', (req, res) => {
  try {
    const location = locations.find(loc => loc.id === req.params.id);
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json({
      id: location.id,
      name: location.name,
      settings: location.settings || {
        groundTemperature: 15
      },
      thresholds: location.thresholds || {
        temperature: { min: -20, max: 30 },
        humidity: { min: 30, max: 70 },
        pressure: { min: 980, max: 1030 }
      },
      warnings: location.warnings || [],
      status: location.status || 'ok',
      lastUpdate: location.lastUpdate || null,
      environmentalData: location.environmentalData || []
    });
  } catch (error) {
    console.error('Error fetching location from config:', error);
    res.status(500).json({ error: 'Failed to fetch location' });
  }
});

// Add update endpoint
router.put('/location/:id/update', validateLocationUpdate, async (req, res) => {
  try {
    const locationIndex = locations.findIndex(loc => loc.id === req.params.id);
    if (locationIndex === -1) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Update location with new data
    const updatedLocation = {
      ...locations[locationIndex],
      ...req.body
    };

    // Validate updated config
    validateConfig(updatedLocation);

    // Update in memory
    locations[locationIndex] = updatedLocation;

    // Update config file
    const configPath = path.join(__dirname, '../config/data/locations.js');
    const configContent = `module.exports = ${JSON.stringify(locations, null, 2)};`;
    await fs.writeFile(configPath, configContent, 'utf8');

    res.json(updatedLocation);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

const safeWriteConfig = async (path, content) => {
  try {
    // Write to temporary file first
    const tempPath = `${path}.tmp`;
    await fs.writeFile(tempPath, content, 'utf8');
    // Then rename to actual file (atomic operation)
    await fs.rename(tempPath, path);
  } catch (error) {
    throw new Error(`Failed to safely write config: ${error.message}`);
  }
};

module.exports = router; 