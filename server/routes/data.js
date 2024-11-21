const express = require('express');
const router = express.Router();
const locations = require('../config/data/locations.js');
const areas = require('../config/data/areas.js');
const { validateLocationUpdate } = require('../middleware/validation');
const { validateConfig } = require('../utils/configValidation');
const fs = require('fs').promises;
const path = require('path');

// Get all locations
router.get('/locations', (req, res) => {
  try {
    const locationsList = locations.map(location => ({
      id: location.id,
      name: location.name,
      settings: location.settings,
      thresholds: location.thresholds,
      warnings: location.warnings,
      status: location.status,
      lastUpdate: location.lastUpdate,
      environmentalData: location.environmentalData
    }));

    res.json(locationsList);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// Get specific location
router.get('/location/:id', (req, res) => {
  try {
    const location = locations.find(loc => loc.id === req.params.id);
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json({
      id: location.id,
      name: location.name,
      settings: location.settings,
      thresholds: location.thresholds,
      warnings: location.warnings,
      status: location.status,
      lastUpdate: location.lastUpdate,
      environmentalData: location.environmentalData
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ error: 'Failed to fetch location' });
  }
});

// Get location statuses
router.get('/locations/status', (req, res) => {
  try {
    const statuses = locations.reduce((acc, location) => {
      acc[location.id] = {
        hasActiveWarnings: location.warnings?.some(w => w.active) || false,
        warnings: location.warnings || []
      };
      return acc;
    }, {});

    res.json(statuses);
  } catch (error) {
    console.error('Error fetching location statuses:', error);
    res.status(500).json({ error: 'Failed to fetch location statuses' });
  }
});

// Get all areas
router.get('/areas', (req, res) => {
  try {
    const areasList = areas.map(area => ({
      name: area.name,
      locations: area.locations.map(locId => {
        const location = locations.find(l => l.id === locId);
        return {
          id: locId,
          name: location?.name || locId
        };
      })
    }));

    res.json(areasList);
  } catch (error) {
    console.error('Error fetching areas:', error);
    res.status(500).json({ error: 'Failed to fetch areas' });
  }
});

// Update location settings
router.put('/location/:id/settings', validateLocationUpdate, async (req, res) => {
  try {
    const locationIndex = locations.findIndex(loc => loc.id === req.params.id);
    if (locationIndex === -1) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Create updated location object
    const updatedLocation = {
      ...locations[locationIndex],
      settings: {
        ...locations[locationIndex].settings,
        ...req.body.settings
      }
    };

    // Validate the complete updated location
    validateConfig(updatedLocation);

    // Update in memory
    locations[locationIndex] = updatedLocation;

    // Update config file
    const configPath = path.join(__dirname, '../config/data/locations.js');
    const configContent = `module.exports = ${JSON.stringify(locations, null, 2)};`;
    await fs.writeFile(configPath, configContent, 'utf8');

    res.json(updatedLocation);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings: ' + error.message });
  }
});

// Update thresholds endpoint
router.put('/location/:id/thresholds', validateLocationUpdate, async (req, res) => {
  try {
    const locationIndex = locations.findIndex(loc => loc.id === req.params.id);
    if (locationIndex === -1) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Update location with new thresholds
    const updatedLocation = {
      ...locations[locationIndex],
      thresholds: req.body  // The body should directly contain the thresholds object
    };

    // Update in memory
    locations[locationIndex] = updatedLocation;

    // Update config file
    const configPath = path.join(__dirname, '../config/data/locations.js');
    const configContent = `module.exports = ${JSON.stringify(locations, null, 2)};`;
    await fs.writeFile(configPath, configContent, 'utf8');

    res.json(updatedLocation);
  } catch (error) {
    console.error('Error updating thresholds:', error);
    res.status(500).json({ error: 'Failed to update thresholds' });
  }
});

// Add warnings endpoints
router.get('/warnings/:locationId', (req, res) => {
  try {
    const location = locations.find(loc => loc.id === req.params.locationId);
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json(location.warnings || []);
  } catch (error) {
    console.error('Error fetching warnings:', error);
    res.status(500).json({ error: 'Failed to fetch warnings' });
  }
});

// Add endpoint to deactivate warnings
router.patch('/warnings/:warningId/deactivate', async (req, res) => {
  try {
    const { userId } = req.body;
    let warningFound = false;

    // Find and update the warning in the locations data
    for (let location of locations) {
      const warningIndex = location.warnings.findIndex(w => w.id === req.params.warningId);
      if (warningIndex !== -1) {
        location.warnings[warningIndex] = {
          ...location.warnings[warningIndex],
          active: false,
          deactivatedBy: userId,
          deactivatedAt: new Date()
        };
        warningFound = true;
        break;
      }
    }

    if (!warningFound) {
      return res.status(404).json({ error: 'Warning not found' });
    }

    // Update the config file
    const configPath = path.join(__dirname, '../config/data/locations.js');
    const configContent = `module.exports = ${JSON.stringify(locations, null, 2)};`;
    await fs.writeFile(configPath, configContent, 'utf8');

    res.json({ success: true });
  } catch (error) {
    console.error('Error deactivating warning:', error);
    res.status(500).json({ error: 'Failed to deactivate warning' });
  }
});

// Add environmental data endpoint
router.get('/environmental/:locationId', (req, res) => {
  try {
    const location = locations.find(loc => loc.id === req.params.locationId);
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // For now, return empty array or mock data
    // In a real application, this would fetch from a database
    res.json(location.environmentalData || []);
  } catch (error) {
    console.error('Error fetching environmental data:', error);
    res.status(500).json({ error: 'Failed to fetch environmental data' });
  }
});

module.exports = router; 