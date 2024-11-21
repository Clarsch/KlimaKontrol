const express = require('express');
const router = express.Router();
const configLoader = require('../config/configLoader');

router.get('/', async (req, res) => {
    try {
        const locationConfig = await configLoader.loadConfig('locations');
        res.json(locationConfig);
    } catch (error) {
        console.error('Failed to load locations:', error);
        res.status(500).json({ error: 'Failed to load locations configuration' });
    }
});

module.exports = router; 