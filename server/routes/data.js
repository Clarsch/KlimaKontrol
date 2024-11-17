const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
  handleUpload, 
  getLocationData, 
  getLocationsStatus 
} = require('../controllers/dataController');

// Configure multer for file upload
const upload = multer({ dest: 'server/data/uploads/' });

// File upload route
router.post('/upload', upload.single('file'), handleUpload);

// Location data routes
router.get('/location/:locationId', getLocationData);
router.get('/locations/status', getLocationsStatus);

module.exports = router; 