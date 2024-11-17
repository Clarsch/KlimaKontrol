const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
  handleUpload, 
  getLocationData, 
  getLocationsStatus, 
  getEnvironmentalData, 
  updateLocationSettings 
} = require('../controllers/dataController');

// Configure multer for file upload
const upload = multer({ dest: 'server/data/uploads/' });

// File upload route
router.post('/upload', upload.single('file'), handleUpload);

// Location data routes
router.get('/location/:locationId', getLocationData);
router.get('/locations/status', getLocationsStatus);
router.get('/environmental/:locationId', getEnvironmentalData);

// Add new route for updating location settings
router.put('/location/:locationId/settings', updateLocationSettings);

module.exports = router; 