const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
  handleUpload, 
  getLocationData, 
  getLocationsStatus, 
  getEnvironmentalData, 
  updateLocationSettings 
} = require('../controllers/dataController');
const areas = require('../config/data/areas');

// Helper function to ensure directory exists
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'data', 'uploads');
    ensureDirectoryExists(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// Update file upload route
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Handle the uploaded file
    handleUpload(req, res);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Location data routes
router.get('/location/:locationId', getLocationData);
router.get('/locations/status', getLocationsStatus);
router.get('/environmental/:locationId', getEnvironmentalData);

// Add new route for updating location settings
router.put('/location/:locationId/settings', updateLocationSettings);

// Update warnings route
router.get('/warnings/:locationId', (req, res) => {
  const { locationId } = req.params;
  const warningsFile = path.join(__dirname, '..', 'data', 'warnings', 'warnings.json');
  
  try {
    ensureDirectoryExists(path.dirname(warningsFile));
    
    let warnings = {};
    if (fs.existsSync(warningsFile)) {
      warnings = JSON.parse(fs.readFileSync(warningsFile, 'utf-8'));
    } else {
      fs.writeFileSync(warningsFile, JSON.stringify({}), 'utf-8');
    }
    
    res.json(warnings[locationId] || []);
  } catch (error) {
    console.error('Error reading warnings:', error);
    res.status(500).json({ error: 'Error reading warnings' });
  }
});

router.patch('/warnings/:warningId/deactivate', (req, res) => {
    const { warningId } = req.params;
    const { userId } = req.body; // Get the user ID from the request
    const warningsFile = path.join(__dirname, '..', 'data', 'warnings', 'warnings.json');
    
    try {
        if (fs.existsSync(warningsFile)) {
            const allWarnings = JSON.parse(fs.readFileSync(warningsFile, 'utf-8'));
            
            // Find and update the warning
            let warningFound = false;
            for (const locationId in allWarnings) {
                const locationWarnings = allWarnings[locationId];
                const warningIndex = locationWarnings.findIndex(w => w.id === warningId);
                
                if (warningIndex !== -1) {
                    allWarnings[locationId][warningIndex].active = false;
                    allWarnings[locationId][warningIndex].deactivatedBy = userId;
                    allWarnings[locationId][warningIndex].deactivatedAt = new Date();
                    warningFound = true;
                    break;
                }
            }
            
            if (warningFound) {
                fs.writeFileSync(warningsFile, JSON.stringify(allWarnings, null, 2));
                res.json({ message: 'Warning deactivated successfully' });
            } else {
                res.status(404).json({ error: 'Warning not found' });
            }
        } else {
            res.status(404).json({ error: 'No warnings found' });
        }
    } catch (error) {
        console.error('Error updating warning:', error);
        res.status(500).json({ error: 'Error updating warning' });
    }
});

// GET /api/data/areas
router.get('/areas', (req, res) => {
  try {
    res.json(areas);
  } catch (error) {
    console.error('Error fetching areas:', error);
    res.status(500).json({ message: 'Error fetching areas data' });
  }
});

module.exports = router; 