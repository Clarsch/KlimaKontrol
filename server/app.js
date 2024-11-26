const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const configLoader = require('./config/configLoader');

async function initializeApp() {
    try {
        // Initialize and validate configs
        await configLoader.initialize();
        
        console.log('\nLoading configurations...');
        const userConfig = await configLoader.loadConfig('users');
        console.log('All configurations loaded successfully\n');

        // Then initialize app and setup routes
        const app = express();
        createRequiredDirectories();
        
        // CORS configuration - place this BEFORE any other middleware
        const corsOptions = {
            origin: [
                'http://localhost:5173',
                'https://klima-kontrol-five.vercel.app'
            ].filter(Boolean),
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
        };

        app.use(cors(corsOptions));
        
        // Add middleware to log all requests
        app.use((req, res, next) => {
            console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`);
            next();
        });

        app.use(express.json());
        
        // Routes
        app.use('/api/auth', authRoutes);
        app.use('/api/data', dataRoutes);
        
        // Error handling middleware
        app.use((err, req, res, next) => {
            console.error('Server error:', err);
            res.status(500).json({ 
                message: 'Internal server error', 
                error: process.env.NODE_ENV === 'development' ? err.message : undefined 
            });
        });

        return app;

    } catch (error) {
        console.error('\nServer initialization failed:');
        console.error('The server requires external configuration files to run.');
        console.error('Please set up the required configuration files and try again.\n');
        process.exit(1);
    }
}

// Helper function to create required directories
function createRequiredDirectories() {
    const directories = [
        'data',
        'data/warnings',
        'data/environmental'
    ];

    directories.forEach(dir => {
        const fullPath = path.join(__dirname, dir);
        if (!fs.existsSync(fullPath)) {
            console.log(`Creating directory: ${fullPath}`);
            fs.mkdirSync(fullPath, { recursive: true });
        }
    });

    const warningsFile = path.join(__dirname, 'data', 'warnings', 'warnings.json');
    if (!fs.existsSync(warningsFile)) {
        console.log(`Creating warnings file: ${warningsFile}`);
        fs.writeFileSync(warningsFile, JSON.stringify({}, null, 2), 'utf8');
    }
}

module.exports = initializeApp();