const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const configLoader = require('../config/configLoader');
const { authenticateToken } = require('../middleware/auth');

// JWT secrets - in production, these should be environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret';

router.post('/login', async (req, res) => {
    try {
        const userConfig = await configLoader.loadConfig('users');
        const { username, password } = req.body;

        // Find user
        const user = userConfig.find(u => u.username === username && u.password === password);

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create access token (shorter expiry)
        const accessToken = jwt.sign(
            { 
                userId: user.username,
                role: user.role,
                areas: user.areas,
                locations: user.locations
            },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        // Create refresh token (longer expiry)
        const refreshToken = jwt.sign(
            { 
                userId: user.username,
                type: 'refresh'
            },
            REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' }
        );

        // Set refresh token as httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Send response with both token and accessToken for compatibility
        res.json({
            token: accessToken, // For frontend compatibility
            accessToken, // For API compatibility
            user: {
                username: user.username,
                name: user.name,
                role: user.role,
                areas: user.areas,
                locations: user.locations
            },
            redirectUrl: user.role === 'collector' ? '/upload' : '/dashboard'
        });
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

// Token refresh endpoint
router.post('/refresh', async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        
        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token required' });
        }

        const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
        
        if (decoded.type !== 'refresh') {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        // Load user data to create new access token
        const userConfig = await configLoader.loadConfig('users');
        const user = userConfig.find(u => u.username === decoded.userId);

        if (!user) {
            return res.status(403).json({ message: 'User not found' });
        }

        // Create new access token
        const newAccessToken = jwt.sign(
            { 
                userId: user.username,
                role: user.role,
                areas: user.areas,
                locations: user.locations
            },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        res.json({ accessToken: newAccessToken });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(403).json({ message: 'Invalid refresh token' });
    }
});

// Logout endpoint
router.post('/logout', (req, res) => {
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
});

// Redirect endpoint for successful login
router.get('/redirect', authenticateToken, (req, res) => {
    try {
        const { role } = req.user;
        const redirectUrl = role === 'collector' ? '/upload' : '/dashboard';
        
        res.json({
            success: true,
            redirectUrl,
            user: req.user
        });
    } catch (error) {
        console.error('Redirect error:', error);
        res.status(500).json({ error: 'Redirect failed' });
    }
});

// Check authentication status
router.get('/status', authenticateToken, (req, res) => {
    res.json({
        authenticated: true,
        user: req.user
    });
});

module.exports = router; 