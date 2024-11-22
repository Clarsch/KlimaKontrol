const express = require('express');
const router = express.Router();
const configLoader = require('../config/configLoader');
const { validateLocationUpdate } = require('../middleware/validation');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const csv = require('csv-parse');

// Import the processData function
const { processData } = require('../utils/dataProcessor');

// Configure multer for file upload
const upload = multer({
    storage: multer.diskStorage({
        destination: async function (req, file, cb) {
            try {
                const location = req.body.location;
                if (!location) {
                    return cb(new Error('Location is required'));
                }

                // Get location config and validate
                const locationConfig = await configLoader.loadConfig('locations');
                const locationExists = locationConfig.some(loc => loc.id === location);

                if (!locationExists) {
                    console.error('Location validation failed:', {
                        providedLocation: location,
                        availableLocations: locationConfig.map(l => l.id)
                    });
                    return cb(new Error(`Location not found in configuration: ${location}`));
                }

                const locationDir = path.join(__dirname, '..', 'data', location);
                await fs.mkdir(locationDir, { recursive: true });
                cb(null, locationDir);
            } catch (error) {
                console.error('Destination error:', error);
                cb(error);
            }
        },
        filename: function (req, file, cb) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            cb(null, `data_${timestamp}.csv`);
        }
    }),
    fileFilter: (req, file, cb) => {
        if (!file.originalname.endsWith('.csv')) {
            return cb(new Error('Only CSV files are allowed'));
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
}).single('file');

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

// Update the upload endpoint
router.post('/upload', function(req, res) {
    console.log('Upload request received:', {
        body: req.body,
        files: req.files,
        headers: req.headers
    });

    upload(req, res, async function(err) {
        if (err instanceof multer.MulterError) {
            console.error('Multer error:', err);
            return res.status(400).json({
                message: 'File upload error',
                error: err.message,
                details: err
            });
        } else if (err) {
            console.error('Upload error:', err);
            return res.status(400).json({
                message: err.message || 'Error uploading file',
                error: err
            });
        }

        try {
            await handleFileUpload(req, res);
        } catch (error) {
            console.error('File processing error:', error);
            res.status(500).json({ 
                message: 'Error processing file',
                error: error.message 
            });
        }
    });
});

// Separate function to handle the file processing
async function handleFileUpload(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const location = req.body.location?.toLowerCase();
        if (!location) {
            return res.status(400).json({ message: 'Location is required' });
        }

        // Get location config for thresholds
        const locationConfig = await configLoader.loadConfig('locations');
        
        // Case-insensitive location search
        const locationData = locationConfig.find(loc => 
            loc.id.toLowerCase() === location.toLowerCase()
        );
        
        if (!locationData) {
            console.error('Invalid location:', location, 'Available locations:', 
                locationConfig.map(l => l.id));
            return res.status(400).json({ 
                message: 'Invalid location',
                detail: `Location '${location}' not found in configuration`
            });
        }

        // Read and parse the uploaded file
        const fileContent = await fs.readFile(req.file.path, 'utf-8');
        
        // Parse CSV and validate data
        const records = await new Promise((resolve, reject) => {
            csv.parse(fileContent, {
                columns: true,
                skip_empty_lines: true
            }, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });

        // Validate data format
        let validationErrors = [];
        records.forEach((record, index) => {
            const temp = parseFloat(record.temperature);
            const humidity = parseFloat(record.relative_humidity);
            const pressure = parseFloat(record.air_pressure);
            
            if (isNaN(temp) || temp < -50 || temp > 50) {
                validationErrors.push(`Row ${index + 1}: Invalid temperature: ${record.temperature}`);
            }
            if (isNaN(humidity) || humidity < 0 || humidity > 100) {
                validationErrors.push(`Row ${index + 1}: Invalid humidity: ${record.relative_humidity}`);
            }
            if (isNaN(pressure) || pressure < 900 || pressure > 1100) {
                validationErrors.push(`Row ${index + 1}: Invalid pressure: ${record.air_pressure}`);
            }
            if (isNaN(Date.parse(record.record_time))) {
                validationErrors.push(`Row ${index + 1}: Invalid date format: ${record.record_time}`);
            }
        });

        if (validationErrors.length > 0) {
            // Clean up uploaded file if validation fails
            await fs.unlink(req.file.path);
            return res.status(400).json({ 
                message: 'Invalid data in CSV file',
                errors: validationErrors
            });
        }

        // Process data for warnings using location thresholds
        const warnings = processData(records, location, locationData.thresholds);

        // Update environmental data file
        const envDataPath = path.join(__dirname, '..', 'data', 'environmental', `${location}.json`);
        let existingData = [];
        try {
            const existingContent = await fs.readFile(envDataPath, 'utf8');
            existingData = JSON.parse(existingContent);
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }

        // Merge and sort data
        const mergedData = [...existingData, ...records].sort((a, b) => 
            new Date(a.record_time) - new Date(b.record_time)
        );

        // Save merged environmental data
        await fs.writeFile(envDataPath, JSON.stringify(mergedData, null, 2));

        res.json({ 
            message: 'File uploaded and processed successfully',
            recordCount: records.length,
            newWarnings: warnings.length
        });

    } catch (error) {
        console.error('File processing error:', error);
        if (req.file) {
            await fs.unlink(req.file.path).catch(console.error);
        }
        res.status(500).json({ 
            message: 'Error processing file',
            error: error.message 
        });
    }
}

// Add this endpoint to get all locations
router.get('/locations', async (req, res) => {
    try {
        const locationConfig = await configLoader.loadConfig('locations');
        
        // Map the locations to include only necessary data
        const locations = locationConfig.map(location => ({
            id: location.id,
            name: location.name
        }));
        
        res.json(locations);
    } catch (error) {
        console.error('Failed to load locations:', error);
        res.status(500).json({ error: 'Failed to load locations configuration' });
    }
});

module.exports = router; 