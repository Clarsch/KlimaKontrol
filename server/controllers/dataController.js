const fs = require('fs');
const csv = require('csv-parse');
const path = require('path');
const warningsConfig = require('../config/data/warnings');
const locationSettings = require('../config/data/settings');
const { checkThresholds } = require('../config/data/warnings');

// Create necessary directories
const DATA_DIR = path.join(__dirname, '..', 'data');
const WARNINGS_DIR = path.join(DATA_DIR, 'warnings');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(WARNINGS_DIR)) {
  fs.mkdirSync(WARNINGS_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Function to load warnings
const loadWarnings = () => {
  const warningsFile = path.join(WARNINGS_DIR, 'warnings.json');
  if (fs.existsSync(warningsFile)) {
    return JSON.parse(fs.readFileSync(warningsFile, 'utf-8'));
  }
  return warningsConfig;
};

// Function to save warnings
const saveWarnings = (warnings) => {
  const warningsFile = path.join(WARNINGS_DIR, 'warnings.json');
  fs.writeFileSync(warningsFile, JSON.stringify(warnings, null, 2));
};

// Initialize warnings from file or create empty
let warnings = loadWarnings();

// Read actual data from files for a specific location
const readLocationData = async (locationId, timeRange) => {
  const locationDir = path.join(DATA_DIR, locationId);
  
  try {
    // Check if directory exists
    if (!fs.existsSync(locationDir)) {
      console.log(`No data directory found for location: ${locationId}`);
      return [];
    }

    // Get all CSV files in the location directory
    const files = fs.readdirSync(locationDir)
      .filter(file => file.endsWith('.csv'))
      .sort((a, b) => b.localeCompare(a)); // Sort newest first

    let allData = [];
    
    // Read and parse each file
    for (const file of files) {
      const fileContent = fs.readFileSync(path.join(locationDir, file), 'utf-8');
      const records = await new Promise((resolve, reject) => {
        csv.parse(fileContent, {
          columns: true,
          skip_empty_lines: true
        }, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });

      allData = [...allData, ...records];
    }

    // Filter data based on timeRange
    const now = new Date();
    const timeRangeInMs = {
      '1day': 24 * 60 * 60 * 1000,
      '1month': 30 * 24 * 60 * 60 * 1000,
      '6months': 180 * 24 * 60 * 60 * 1000,
      '1year': 365 * 24 * 60 * 60 * 1000
    };

    const filteredData = allData.filter(record => {
      const recordDate = new Date(record.record_time);
      return (now - recordDate) <= timeRangeInMs[timeRange];
    });

    // Sort by timestamp
    return filteredData.sort((a, b) => 
      new Date(a.record_time) - new Date(b.record_time)
    );

  } catch (error) {
    console.error(`Error reading data for location ${locationId}:`, error);
    return [];
  }
};

// Process uploaded data and check for threshold breaches
const processData = (records, locationId) => {
  const settings = locationSettings[locationId];
  const thresholds = settings.thresholds;
  const newWarnings = [];

  records.forEach(record => {
    const temp = parseFloat(record.temperature);
    const humidity = parseFloat(record.relative_humidity);
    
    // Check temperature thresholds
    if (temp < thresholds.temperature.min) {
      newWarnings.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        locationId: locationId,
        type: 'Temperature',
        message: `Temperature too low: ${temp}°C (min: ${thresholds.temperature.min}°C)`,
        timestamp: record.record_time,
        active: true,
        value: temp,
        threshold: thresholds.temperature.min
      });
    } else if (temp > thresholds.temperature.max) {
      newWarnings.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        locationId: locationId,
        type: 'Temperature',
        message: `Temperature too high: ${temp}°C (max: ${thresholds.temperature.max}°C)`,
        timestamp: record.record_time,
        active: true,
        value: temp,
        threshold: thresholds.temperature.max
      });
    }

    // Check humidity thresholds
    if (humidity < thresholds.humidity.min) {
      newWarnings.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        locationId: locationId,
        type: 'Humidity',
        message: `Humidity too low: ${humidity}% (min: ${thresholds.humidity.min}%)`,
        timestamp: record.record_time,
        active: true,
        value: humidity,
        threshold: thresholds.humidity.min
      });
    } else if (humidity > thresholds.humidity.max) {
      newWarnings.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        locationId: locationId,
        type: 'Humidity',
        message: `Humidity too high: ${humidity}% (max: ${thresholds.humidity.max}%)`,
        timestamp: record.record_time,
        active: true,
        value: humidity,
        threshold: thresholds.humidity.max
      });
    }
  });

  // Load existing warnings
  const warningsFile = path.join(WARNINGS_DIR, 'warnings.json');
  let allWarnings = {};
  
  if (fs.existsSync(warningsFile)) {
    try {
      allWarnings = JSON.parse(fs.readFileSync(warningsFile, 'utf-8'));
    } catch (error) {
      console.error('Error reading warnings file:', error);
    }
  }

  // Add new warnings to existing ones
  allWarnings[locationId] = [...(allWarnings[locationId] || []), ...newWarnings];

  // Save updated warnings
  try {
    fs.writeFileSync(warningsFile, JSON.stringify(allWarnings, null, 2));
  } catch (error) {
    console.error('Error saving warnings:', error);
  }

  return newWarnings;
};

exports.handleUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const location = req.body.location;
    if (!location) {
      return res.status(400).json({ message: 'Location is required' });
    }

    // Read the uploaded file
    const fileContent = fs.readFileSync(req.file.path, 'utf-8');

    // Parse CSV
    csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    }, async (err, records) => {
      if (err) {
        console.error('CSV parsing error:', err);
        return res.status(400).json({ message: 'Invalid CSV format' });
      }

      // Validate data format
      let validationErrors = [];
      const isValid = records.every((record, index) => {
        const temp = parseFloat(record.temperature);
        const humidity = parseFloat(record.relative_humidity);
        const pressure = parseFloat(record.air_pressure);
        
        if (isNaN(temp) || temp < -50 || temp > 50) {
          validationErrors.push(`Row ${index + 1}: Invalid temperature: ${record.temperature}`);
          return false;
        }
        if (isNaN(humidity) || humidity < 0 || humidity > 100) {
          validationErrors.push(`Row ${index + 1}: Invalid humidity: ${record.relative_humidity}`);
          return false;
        }
        if (isNaN(pressure) || pressure < 900 || pressure > 1100) {
          validationErrors.push(`Row ${index + 1}: Invalid pressure: ${record.air_pressure}`);
          return false;
        }
        if (isNaN(Date.parse(record.record_time))) {
          validationErrors.push(`Row ${index + 1}: Invalid date format: ${record.record_time}`);
          return false;
        }
        return true;
      });

      if (!isValid) {
        console.error('Validation errors:', validationErrors);
        return res.status(400).json({ 
          message: 'Invalid data in CSV file',
          errors: validationErrors
        });
      }

      // Create directory for location if it doesn't exist
      const locationDir = path.join(DATA_DIR, location);
      if (!fs.existsSync(locationDir)) {
        fs.mkdirSync(locationDir, { recursive: true });
      }

      // Save processed data
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const savedFilePath = path.join(locationDir, `data_${timestamp}.csv`);
      fs.writeFileSync(savedFilePath, fileContent);

      // Process data for warnings
      const newWarnings = processData(records, location);

      // Clean up temporary upload file
      fs.unlinkSync(req.file.path);

      res.json({ 
        message: 'File uploaded and processed successfully',
        recordCount: records.length,
        newWarnings: newWarnings.length
      });
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error processing file' });
  }
};

exports.getLocationData = async (req, res) => {
  const { locationId } = req.params;
  try {
    const locationWarnings = warnings[locationId] || [];
    const settings = locationSettings[locationId] || { 
      groundTemperature: 15,
      thresholds: {
        temperature: { min: 2, max: 22 },
        humidity: { min: 45, max: 65 },
        pressure: { min: 980, max: 1030 }
      }
    };
    
    res.json({
      location: locationId,
      warnings: locationWarnings,
      hasActiveWarnings: locationWarnings.some(w => w.status === 'active'),
      settings: settings
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching location data' });
  }
};

exports.updateLocationSettings = async (req, res) => {
  const { locationId } = req.params;
  const { settings } = req.body;

  try {
    locationSettings[locationId] = {
      ...locationSettings[locationId],
      ...settings
    };

    res.json({
      location: locationId,
      settings: locationSettings[locationId]
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating location settings' });
  }
};

exports.getLocationsStatus = async (req, res) => {
  try {
    // Read warnings file
    const warningsFile = path.join(__dirname, '..', 'data', 'warnings', 'warnings.json');
    let currentWarnings = {};
    
    if (fs.existsSync(warningsFile)) {
      currentWarnings = JSON.parse(fs.readFileSync(warningsFile, 'utf-8'));
    }

    // Initialize response object
    const locationStatuses = {};

    // Get all locations from areas configuration
    const areas = require('../config/data/areas');
    const allLocations = areas.flatMap(area => area.locations);

    // Process each location
    allLocations.forEach(location => {
      // Ensure currentWarnings[location] exists and is an array
      const locationWarnings = currentWarnings[location] || [];
      
      locationStatuses[location] = {
        warnings: locationWarnings,
        hasActiveWarnings: locationWarnings.some(w => w.active),
        activeWarningsCount: locationWarnings.filter(w => w.active).length
      };
    });

    res.json(locationStatuses);
  } catch (error) {
    console.error('Error getting locations status:', error);
    res.status(500).json({ error: 'Error getting locations status' });
  }
};

exports.getEnvironmentalData = async (req, res) => {
  const { locationId } = req.params;
  const { timeRange = '1month' } = req.query;

  try {
    const data = await readLocationData(locationId, timeRange);
    res.json(data);
  } catch (error) {
    console.error('Error fetching environmental data:', error);
    res.status(500).json({ message: 'Error fetching environmental data' });
  }
};

exports.handleNewEnvironmentalData = (locationId, data, thresholds) => {
  // Your existing data processing logic...

  // Check thresholds and create warnings if needed
  const newWarnings = checkThresholds(locationId, data, thresholds);
  
  // You might want to implement some notification logic here if new warnings are created
  if (newWarnings.length > 0) {
    console.log(`Created ${newWarnings.length} new warnings for location ${locationId}`);
  }
}; 