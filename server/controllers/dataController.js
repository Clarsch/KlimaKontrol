const fs = require('fs');
const csv = require('csv-parse');
const path = require('path');

// Mock data for warnings (in real app, this would come from a database)
const warnings = {
  "Bov Kirke": [
    { id: 1, type: "temperature", status: "active", message: "Temperature too low" },
  ],
  "Aabenraa Kirke": [],
  "Haderslev Kirke": [
    { id: 2, type: "humidity", status: "active", message: "Humidity too high" },
  ],
  "Padborg Kirke": [],
  "Rise Kirke": []
};

// Add location settings to our mock data
const locationSettings = {
  "Bov Kirke": { groundTemperature: 15 },
  "Aabenraa Kirke": { groundTemperature: 15 },
  "Haderslev Kirke": { groundTemperature: 15 },
  "Padborg Kirke": { groundTemperature: 15 },
  "Rise Kirke": { groundTemperature: 15 }
};

// Mock environmental data generator
const generateMockData = (timeRange) => {
  const data = [];
  const now = new Date();
  const points = timeRange === '1day' ? 288 : // 5-minute intervals for 1 day
                timeRange === '1month' ? 720 : // 1-hour intervals for 1 month
                timeRange === '6months' ? 4320 : // 1-hour intervals for 6 months
                8760; // 1-hour intervals for 1 year

  for (let i = points; i >= 0; i--) {
    const timestamp = new Date(now - i * (timeRange === '1day' ? 5 * 60000 : 3600000));
    
    // Add some random variation to make the data look realistic
    const baseTemp = 20 + Math.sin(i / (points/4)) * 10;
    const baseHumidity = 50 + Math.sin(i / (points/6)) * 20;
    const basePressure = 1013 + Math.sin(i / (points/8)) * 20;

    data.push({
      record_time: timestamp.toISOString(),
      temperature: +(baseTemp + Math.random() * 2 - 1).toFixed(1),
      relative_humidity: +(baseHumidity + Math.random() * 4 - 2).toFixed(1),
      air_pressure: +(basePressure + Math.random() * 2 - 1).toFixed(1)
    });
  }

  return data;
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
    const settings = locationSettings[locationId] || { groundTemperature: 15 };
    
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
    // In a real app, this would update a database
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
    // In a real app, you would fetch this from your database
    // For now, we'll generate mock data
    const data = generateMockData(timeRange);
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching environmental data:', error);
    res.status(500).json({ message: 'Error fetching environmental data' });
  }
}; 