const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const uploadRoutes = require('./routes/upload');
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
        
        // Enhanced CORS configuration
        const corsOrigins = process.env.CORS_ORIGINS 
            ? process.env.CORS_ORIGINS.split(',')
            : [
                'https://klima-kontrol-five.vercel.app',  // Production frontend URL
                'http://localhost:3000',                   // Local development
                'http://localhost:5173',                   // Vite dev server
                'http://localhost:4173',                   // Vite preview server
                'http://127.0.0.1:5173',                  // Alternative localhost
                'http://127.0.0.1:3000'                   // Alternative localhost
            ];

        const corsOptions = {
            origin: corsOrigins,
            credentials: true, // Enable cookies and credentials
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: [
                'Content-Type', 
                'Authorization', 
                'ngrok-skip-browser-warning'
            ],
            optionsSuccessStatus: 200 // For legacy browser support
        };

        app.use(cors(corsOptions));
        
        // Handle preflight requests
        app.options('*', cors(corsOptions));
        
        // Add middleware to log all requests
        app.use((req, res, next) => {
            console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`);
            next();
        });

        app.use(express.json());
        app.use(cookieParser());
        
        // Test endpoint for CORS verification
        app.get('/api/test', (req, res) => {
            res.json({ 
                message: 'CORS working!', 
                timestamp: new Date().toISOString(),
                origin: req.headers.origin 
            });
        });

        // Routes
        app.use('/api/auth', authRoutes);
        app.use('/api/data', dataRoutes);
        app.use('/api/upload', uploadRoutes);
        
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