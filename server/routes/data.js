const express = require('express');
const router = express.Router();
const configLoader = require('../config/configLoader');
const { validateLocationUpdate } = require('../middleware/validation');
const fs = require('fs').promises;
const path = require('path');

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

// Add this endpoint for fetching individual location details
router.get('/location/:locationId', async (req, res) => {
    try {
        const locationConfig = await configLoader.loadConfig('locations');
        const location = locationConfig.find(loc => loc.id === req.params.locationId);
        
        if (!location) {
            return res.status(404).json({ error: 'Location not found' });
        }
        
        res.json(location);
    } catch (error) {
        console.error('Failed to load location details:', error);
        res.status(500).json({ error: 'Failed to load location details' });
    }
});

// Add endpoint for updating location settings
router.put('/location/:locationId/settings', validateLocationUpdate, async (req, res) => {
    try {
        const locationConfig = await configLoader.loadConfig('locations');
        const locationIndex = locationConfig.findIndex(loc => loc.id === req.params.locationId);
        
        if (locationIndex === -1) {
            return res.status(404).json({ error: 'Location not found' });
        }

        locationConfig[locationIndex].settings = {
            ...locationConfig[locationIndex].settings,
            ...req.body.settings
        };

        // Save updated config
        await configLoader.saveConfig('locations', locationConfig);
        
        res.json({
            location: locationConfig[locationIndex].id,
            settings: locationConfig[locationIndex].settings
        });
    } catch (error) {
        console.error('Failed to update location settings:', error);
        res.status(500).json({ error: 'Failed to update location settings' });
    }
});

// Add endpoint for updating location thresholds
router.put('/location/:locationId/thresholds', validateLocationUpdate, async (req, res) => {
    try {
        const locationConfig = await configLoader.loadConfig('locations');
        const locationIndex = locationConfig.findIndex(loc => loc.id === req.params.locationId);
        
        if (locationIndex === -1) {
            return res.status(404).json({ error: 'Location not found' });
        }

        locationConfig[locationIndex].thresholds = {
            ...locationConfig[locationIndex].thresholds,
            ...req.body
        };

        // Save updated config
        await configLoader.saveConfig('locations', locationConfig);
        
        res.json({
            location: locationConfig[locationIndex].id,
            thresholds: locationConfig[locationIndex].thresholds
        });
    } catch (error) {
        console.error('Failed to update location thresholds:', error);
        res.status(500).json({ error: 'Failed to update location thresholds' });
    }
});

// Update the environmental data endpoint
router.get('/environmental/:locationId', async (req, res) => {
    try {
        const { timeRange = '1month' } = req.query;
        const dataDir = path.join(__dirname, '..', 'data', 'environmental');
        const locationFile = path.join(dataDir, `${req.params.locationId}.json`);
        
        try {
            // Use fs.promises.access instead of fs.existsSync
            await fs.access(locationFile);
            const fileData = await fs.readFile(locationFile, 'utf8');
            const data = JSON.parse(fileData);
            
            // Filter data based on timeRange
            const now = new Date();
            const timeRangeInMs = {
                '1day': 24 * 60 * 60 * 1000,
                '1month': 30 * 24 * 60 * 60 * 1000,
                '6months': 180 * 24 * 60 * 60 * 1000,
                '1year': 365 * 24 * 60 * 60 * 1000
            };
            
            const filteredData = data.filter(record => {
                const recordDate = new Date(record.record_time);
                return (now - recordDate) <= timeRangeInMs[timeRange];
            });
            
            res.json(filteredData);
        } catch (error) {
            if (error.code === 'ENOENT') {
                // File doesn't exist, return empty array
                return res.json([]);
            }
            throw error;
        }
    } catch (error) {
        console.error('Failed to load environmental data:', error);
        res.status(500).json({ error: 'Failed to load environmental data' });
    }
});

// Fix the warnings endpoint
router.get('/warnings/:locationId', async (req, res) => {
    try {
        const warningsDir = path.join(__dirname, '..', 'data', 'warnings');
        const warningsFile = path.join(warningsDir, 'warnings.json');
        
        try {
            await fs.access(warningsFile);
            const warningsData = await fs.readFile(warningsFile, 'utf8');
            const warnings = JSON.parse(warningsData);
            const locationWarnings = warnings[req.params.locationId] || [];
            res.json(locationWarnings);
        } catch (error) {
            if (error.code === 'ENOENT') {
                // File doesn't exist, return empty array
                return res.json([]);
            }
            throw error;
        }
    } catch (error) {
        console.error('Failed to load warnings:', error);
        res.status(500).json({ error: 'Failed to load warnings' });
    }
});

// Fix the deactivate warning endpoint
router.patch('/warnings/:warningId/deactivate', async (req, res) => {
    try {
        const warningsFile = path.join(__dirname, '..', 'data', 'warnings', 'warnings.json');
        const warningsData = await fs.readFile(warningsFile, 'utf8');
        const warnings = JSON.parse(warningsData);
        
        // Find and update the warning
        let found = false;
        for (const locationId in warnings) {
            const warningIndex = warnings[locationId].findIndex(w => w.id === req.params.warningId);
            if (warningIndex !== -1) {
                warnings[locationId][warningIndex].active = false;
                warnings[locationId][warningIndex].deactivatedBy = req.body.userId;
                warnings[locationId][warningIndex].deactivatedAt = new Date().toISOString();
                found = true;
                break;
            }
        }

        if (!found) {
            return res.status(404).json({ error: 'Warning not found' });
        }

        await fs.writeFile(warningsFile, JSON.stringify(warnings, null, 2), 'utf8');
        res.json({ success: true });
    } catch (error) {
        console.error('Failed to deactivate warning:', error);
        res.status(500).json({ error: 'Failed to deactivate warning' });
    }
});

module.exports = router; 