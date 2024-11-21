const express = require('express');
const router = express.Router();
const configLoader = require('../config/configLoader');

// Get areas with their complete location data
router.get('/areas', async (req, res) => {
    try {
        const areas = await configLoader.getAreasWithLocations();
        res.json(areas);
    } catch (error) {
        console.error('Failed to load areas:', error);
        res.status(500).json({ error: 'Failed to load areas data' });
    }
});

// Get locations status
router.get('/locations/status', async (req, res) => {
    try {
        const locationConfig = await configLoader.loadConfig('locations');
        const statusMap = locationConfig.reduce((acc, location) => {
            acc[location.id] = {
                name: location.name,
                hasActiveWarnings: false,
                warnings: [],
                lastUpdate: new Date().toISOString()
            };
            return acc;
        }, {});
        
        res.json(statusMap);
    } catch (error) {
        console.error('Failed to load location statuses:', error);
        res.status(500).json({ error: 'Failed to load location status data' });
    }
});

module.exports = router; 