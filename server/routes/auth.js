const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const configLoader = require('../config/configLoader');

router.post('/login', async (req, res) => {
    try {
        const userConfig = await configLoader.loadConfig('users');
        const { username, password } = req.body;

        // Find user
        const user = userConfig.find(u => u.username === username && u.password === password);

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create token with correct role
        const token = jwt.sign(
            { 
                userId: user.username,
                role: user.role,
                areas: user.areas,
                locations: user.locations
            },
            'your-secret-key',
            { expiresIn: '24h' }
        );

        // Send response
        res.json({
            token,
            user: {
                username: user.username,
                role: user.role,
                areas: user.areas,
                locations: user.locations
            }
        });
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

module.exports = router; 