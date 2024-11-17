const express = require('express');
const router = express.Router();
const multer = require('multer');
const { handleUpload } = require('../controllers/dataController');

// Configure multer for file upload
const upload = multer({ dest: 'server/data/uploads/' });

router.post('/upload', upload.single('file'), handleUpload);

module.exports = router; 