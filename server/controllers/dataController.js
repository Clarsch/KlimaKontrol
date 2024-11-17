const fs = require('fs');
const csv = require('csv-parse');
const path = require('path');
const warnings = require('../config/data/warnings');
const locationSettings = require('../config/data/settings');

// Read actual data from files
const readLocationData = async (locationId, timeRange) => {
  const locationDir = path.join(__dirname, '..', 'data', locationId);
  
  try {
    // Check if directory exists
    if (!fs.existsSync(locationDir)) {
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
    console.error('Error reading location data:', error);
    return [];
  }
};

// Export all the controller functions
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
    }, (err, records) => {
      if (err) {
        return res.status(400).json({ message: 'Invalid CSV format' });
      }

      // Validate data format
      const isValid = records.every(record => {
        const temp = parseFloat(record.temperature);
        const humidity = parseFloat(record.relative_humidity);
        const pressure = parseFloat(record.air_pressure);
        
        return (
          // Validate temperature (-50°C to +50°C)
          temp >= -50 && temp <= 50 &&
          // Validate humidity (0-100%)
          humidity >= 0 && humidity <= 100 &&
          // Validate air pressure (970-1050 hPa)
          pressure >= 970 && pressure <= 1050 &&
          // Validate date format
          !isNaN(Date.parse(record.record_time))
        );
      });

      if (!isValid) {
        return res.status(400).json({ message: 'Invalid data in CSV file' });
      }

      // Create directory for location if it doesn't exist
      const locationDir = path.join(__dirname, '..', 'data', location);
      if (!fs.existsSync(locationDir)) {
        fs.mkdirSync(locationDir, { recursive: true });
      }

      // Save processed data
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const savedFilePath = path.join(locationDir, `data_${timestamp}.csv`);
      fs.writeFileSync(savedFilePath, fileContent);

      // Clean up temporary upload file
      fs.unlinkSync(req.file.path);

      res.json({ 
        message: 'File uploaded and processed successfully',
        recordCount: records.length
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
    const statuses = {};
    Object.keys(warnings).forEach(location => {
      const activeWarnings = warnings[location].filter(w => w.status === 'active');
      statuses[location] = {
        hasActiveWarnings: activeWarnings.length > 0,
        warnings: warnings[location],
        activeWarningCount: activeWarnings.length
      };
    });
    res.json(statuses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching locations status' });
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