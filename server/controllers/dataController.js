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
    // Get warnings for the location
    const locationWarnings = warnings[locationId] || [];
    
    // In a real app, you would fetch actual data from files/database
    // For now, return mock data
    res.json({
      location: locationId,
      warnings: locationWarnings,
      hasActiveWarnings: locationWarnings.some(w => w.status === 'active')
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching location data' });
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