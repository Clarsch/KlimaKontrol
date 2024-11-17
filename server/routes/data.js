const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { 
  handleUpload, 
  getLocationData, 
  getLocationsStatus, 
  getEnvironmentalData, 
  updateLocationSettings 
} = require('../controllers/dataController');

// Configure multer for file upload with proper path
const upload = multer({ 
  dest: path.join(__dirname, '..', 'data', 'uploads')
});

// File upload route
router.post('/upload', upload.single('file'), handleUpload);

// Location data routes
router.get('/location/:locationId', getLocationData);
router.get('/locations/status', getLocationsStatus);
router.get('/environmental/:locationId', getEnvironmentalData);

// Add new route for updating location settings
router.put('/location/:locationId/settings', updateLocationSettings);

module.exports = router; 