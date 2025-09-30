const express = require('express');
const router = express.Router();
const configLoader = require('../config/configLoader');
const { validateLocationUpdate } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
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
        const warningsPath = path.join(__dirname, '..', 'data', 'warnings', 'warnings.json');
        
        // Read warnings file
        let warningsData = {};
        try {
            const warningsContent = await fs.readFile(warningsPath, 'utf8');
            warningsData = JSON.parse(warningsContent);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }

        const statusMap = locationConfig.reduce((acc, location) => {
            const locationWarnings = warningsData[location.id] || [];
            const activeWarnings = locationWarnings.filter(w => w.active);
            
            acc[location.id] = {
                name: location.name,
                hasActiveWarnings: activeWarnings.length > 0,
                warnings: activeWarnings,
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

/**
 * Manipulates environmental data to a target number of data points
 * Uses intelligent sampling to maintain data quality and representativeness
 * @param {Array} data - Array of environmental data records
 * @param {number} targetPoints - Target number of data points to return
 * @returns {Array} Manipulated data array with target number of points
 */
function manipulateDataToTargetPoints(data, targetPoints) {
    if (!data || data.length === 0) {
        return [];
    }
    
    if (data.length <= targetPoints) {
        return data; // No manipulation needed
    }
    
    // Sort data by timestamp to ensure chronological order
    const sortedData = [...data].sort((a, b) => 
        new Date(a.record_time) - new Date(b.record_time)
    );
    
    // For small datasets, use a more conservative approach
    if (data.length <= targetPoints * 2) {
        // If we're only reducing by a small amount, use every other point
        const step = Math.ceil(data.length / targetPoints);
        const sampledData = [];
        
        for (let i = 0; i < sortedData.length; i += step) {
            if (sampledData.length < targetPoints) {
                sampledData.push(sortedData[i]);
            }
        }
        
        // Ensure we include the last point if we haven't reached target
        if (sampledData.length < targetPoints && sortedData.length > 1) {
            sampledData.push(sortedData[sortedData.length - 1]);
        }
        
        return sampledData.sort((a, b) => 
            new Date(a.record_time) - new Date(b.record_time)
        );
    }
    
    // For larger datasets, use more aggressive sampling
    const samplingInterval = Math.ceil(data.length / targetPoints);
    const sampledData = [];
    
    // Always include the first data point
    sampledData.push(sortedData[0]);
    
    // Sample at regular intervals
    for (let i = samplingInterval; i < sortedData.length - 1; i += samplingInterval) {
        if (sampledData.length < targetPoints) {
            sampledData.push(sortedData[i]);
        }
    }
    
    // Always include the last data point if we haven't reached target
    if (sampledData.length < targetPoints && sortedData.length > 1) {
        sampledData.push(sortedData[sortedData.length - 1]);
    }
    
    // If we still haven't reached target, add more points strategically
    if (sampledData.length < targetPoints) {
        const remainingSlots = targetPoints - sampledData.length;
        const remainingData = sortedData.filter(item => !sampledData.includes(item));
        
        // Add remaining points evenly distributed
        for (let i = 0; i < remainingSlots && i < remainingData.length; i++) {
            const index = Math.floor((i * remainingData.length) / remainingSlots);
            if (sampledData.length < targetPoints) {
                sampledData.push(remainingData[index]);
            }
        }
    }
    
    // Sort by timestamp to maintain chronological order
    return sampledData.sort((a, b) => 
        new Date(a.record_time) - new Date(b.record_time)
    );
}

// Update the environmental data endpoint
router.get('/environmental/:locationId', async (req, res) => {
    try {
        const { from, to } = req.query;
        
        // Validate required 'from' parameter
        if (!from) {
            return res.status(400).json({ 
                error: 'Missing required parameter: from' 
            });
        }
        
        // Parse dates
        const fromDate = new Date(from);
        const toDate = to ? new Date(to) : new Date(); // Default to current time if 'to' not provided
        
        // Validate date parsing
        if (isNaN(fromDate.getTime())) {
            return res.status(400).json({ 
                error: 'Invalid from date format. Use ISO 8601 format (e.g., 2024-01-01T00:00:00.000Z)' 
            });
        }
        
        if (to && isNaN(toDate.getTime())) {
            return res.status(400).json({ 
                error: 'Invalid to date format. Use ISO 8601 format (e.g., 2024-01-01T00:00:00.000Z)' 
            });
        }
        
        // Ensure we never return data newer than current time
        const now = new Date();
        if (toDate > now) {
            toDate.setTime(now.getTime());
        }
        
        const dataDir = path.join(__dirname, '..', 'data', 'environmental');
        const locationFile = path.join(dataDir, `${req.params.locationId}.json`);
        
        try {
            // Use fs.promises.access instead of fs.existsSync
            await fs.access(locationFile);
            const fileData = await fs.readFile(locationFile, 'utf8');
            const data = JSON.parse(fileData);
            
            // Filter data based on from/to dates and ensure no future data
            const filteredData = data.filter(record => {
                const recordDate = new Date(record.record_time);
                
                // Never return data newer than current time
                if (recordDate > now) {
                    return false;
                }
                
                // Filter by date range
                return recordDate >= fromDate && recordDate <= toDate;
            });
            
            // Manipulate data down to 150 data points for optimal client performance
            const manipulatedData = manipulateDataToTargetPoints(filteredData, 150);
            
            console.log(`Environmental data for ${req.params.locationId}: ${filteredData.length} records filtered, ${manipulatedData.length} records returned`);
            
            res.json(manipulatedData);
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

router.post('/reading/dataReading', authenticateToken, async (req, res) => {
    try {
        const dataReading = req.body;
        console.log("Data Reading received of: " + JSON.stringify(dataReading, null, 2))
        
        // Validate required fields
        if (!dataReading.sensor_id) {
            return res.status(400).json({ 
                message: 'sensor_id is required for data readings' 
            });
        }
        
        if (!dataReading.location_id) {
            return res.status(400).json({ 
                message: 'location_id is required for data readings' 
            });
        }
        
        records = [dataReading]
        const location = dataReading.location_id.toLowerCase();

        processFileData(req, res, location, records)

        
    } catch (error) {
        console.error("Data Reading resulted in an error:", error);
        res.status(500).json({ message: "Error processing data reading." });
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

// Batch JSON upload endpoint for data provider
router.post('/upload', authenticateToken, async (req, res) => {
    try {
        console.log('Batch upload request received:', {
            body: req.body,
            headers: req.headers
        });

        // Check if this is a JSON batch upload (from data provider)
        if (req.body.readings && Array.isArray(req.body.readings)) {
            return await handleBatchJsonUpload(req, res);
        }

        // Otherwise, handle as file upload
        return handleFileUpload(req, res);
    } catch (error) {
        console.error('Upload endpoint error:', error);
        res.status(500).json({ 
            message: 'Error processing upload', 
            error: error.message 
        });
    }
});

// Handle batch JSON uploads from data provider
async function handleBatchJsonUpload(req, res) {
    try {
        const { readings, batch_id, timestamp } = req.body;
        
        if (!readings || !Array.isArray(readings)) {
            return res.status(400).json({ 
                message: 'Invalid batch data: readings array is required' 
            });
        }

        if (readings.length === 0) {
            return res.status(200).json({ 
                message: 'No readings to process', 
                count: 0 
            });
        }

        console.log(`Processing batch ${batch_id} with ${readings.length} readings`);

        // Process each reading
        const processedReadings = [];
        const errors = [];

        for (let i = 0; i < readings.length; i++) {
            const reading = readings[i];
            
            try {
                // Validate required fields
                if (!reading.sensor_id) {
                    errors.push(`Reading ${i}: sensor_id is required`);
                    continue;
                }
                
                if (!reading.location_id) {
                    errors.push(`Reading ${i}: location_id is required`);
                    continue;
                }

                // Process the reading using the existing logic
                const location = reading.location_id.toLowerCase();
                const records = [reading];
                
                // Call the existing processFileData function
                await processFileData(req, res, location, records);
                processedReadings.push(reading);
                
            } catch (error) {
                console.error(`Error processing reading ${i}:`, error);
                errors.push(`Reading ${i}: ${error.message}`);
            }
        }

        const response = {
            message: `Processed ${processedReadings.length} of ${readings.length} readings`,
            processed_count: processedReadings.length,
            total_count: readings.length,
            batch_id: batch_id,
            errors: errors.length > 0 ? errors : undefined
        };

        if (errors.length > 0) {
            console.warn(`Batch ${batch_id} had ${errors.length} errors:`, errors);
        }

        res.status(200).json(response);

    } catch (error) {
        console.error('Batch JSON upload error:', error);
        res.status(500).json({ 
            message: 'Error processing batch upload', 
            error: error.message 
        });
    }
}

// File upload endpoint (original functionality)
function handleFileUpload(req, res) {
    console.log('File upload request received:', {
        body: req.body,
        files: req.files,
        headers: req.headers
    });

    upload.single('file')(req, res, async function(err) {
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
            await handleFileUploadProcessing(req, res);
        } catch (error) {
            console.error('File processing error:', error);
            res.status(500).json({ 
                message: 'Error processing file',
                error: error.message 
            });
        }
    });
}

// Separate function to handle the file processing
async function handleFileUploadProcessing(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const location = req.body.location?.toLowerCase();
        if (!location) {
            return res.status(400).json({ message: 'Location is required' });
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

        // Add location_id to each record from the upload location
        const recordsWithLocation = records.map(record => ({
            ...record,
            location_id: location
        }));

        processFileData(req, res, location, recordsWithLocation)
    
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
    
async function processFileData(req, res, location, records) {
    try {
        
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

        // Validate data format
        let validationErrors = [];
        records.forEach((record, index) => {
            // Validate sensor_id
            if (!record.sensor_id || typeof record.sensor_id !== 'string') {
                validationErrors.push(`Row ${index + 1}: Missing or invalid sensor_id`);
            }
            
            // Validate location_id
            if (!record.location_id || typeof record.location_id !== 'string') {
                validationErrors.push(`Row ${index + 1}: Missing or invalid location_id`);
            }
            
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

        // Add UUIDs to records and ensure location_id is set
        const { addUUIDToRecord } = require('../utils/uuidGenerator');
        const processedRecords = records.map(record => {
            // If record doesn't have location_id, add it from the location parameter
            const recordWithLocation = record.location_id ? record : {
                ...record,
                location_id: location
            };
            return addUUIDToRecord(recordWithLocation);
        });

        // Process data for warnings using location thresholds
        const warnings = processData(processedRecords, location, locationData.thresholds);

        // Add this code to save warnings
        const warningsPath = path.join(__dirname, '..', 'data', 'warnings', 'warnings.json');
        let existingWarnings = {};
        try {
            const warningsContent = await fs.readFile(warningsPath, 'utf8');
            existingWarnings = JSON.parse(warningsContent);
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }

        // Add new warnings to existing ones
        existingWarnings[location] = [
            ...(existingWarnings[location] || []),
            ...warnings
        ];

        // Save updated warnings
        await fs.writeFile(warningsPath, JSON.stringify(existingWarnings, null, 2));

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
        const mergedData = [...existingData, ...processedRecords].sort((a, b) => 
            new Date(a.record_time) - new Date(b.record_time)
        );

        // Save merged environmental data
        await fs.writeFile(envDataPath, JSON.stringify(mergedData, null, 2));

        console.log(`Created ${warnings.length} warnings for location ${location}:`, 
            warnings.map(w => ({type: w.type, message: w.message})));

        res.json({ 
            message: 'File uploaded and processed successfully',
            recordCount: processedRecords.length,
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

// Replace the existing /warnings/active route with this:
router.get('/warnings/active', async (req, res) => {
  try {
    const warningsPath = path.join(__dirname, '..', 'data', 'warnings', 'warnings.json');
    
    // Read warnings file
    let warnings = [];
    try {
      const warningsContent = await fs.readFile(warningsPath, 'utf8');
      const warningsData = JSON.parse(warningsContent);
      
      // Transform the warnings data structure into a flat array of active warnings
      Object.entries(warningsData).forEach(([locationId, locationWarnings]) => {
        const activeWarnings = locationWarnings
          .filter(warning => warning.active)
          .map(warning => ({
            ...warning,
            locationId
          }));
        warnings.push(...activeWarnings);
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        warnings = [];
      } else {
        throw error;
      }
    }
    
    res.json(warnings);
  } catch (error) {
    console.error('Error fetching active warnings:', error);
    res.status(500).json({ error: 'Failed to fetch active warnings' });
    }
});

module.exports = router; 