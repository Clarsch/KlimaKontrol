const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow CSV and JSON files
        const allowedTypes = ['.csv', '.json'];
        const fileExt = path.extname(file.originalname).toLowerCase();
        
        if (allowedTypes.includes(fileExt)) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV and JSON files are allowed'), false);
        }
    }
});

// File upload endpoint
router.post('/file', authenticateToken, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { originalname, mimetype, size, buffer } = req.file;
        
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, '../data/uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const fileExt = path.extname(originalname);
        const fileName = `${timestamp}_${originalname}`;
        const filePath = path.join(uploadsDir, fileName);

        // Save file to disk
        fs.writeFileSync(filePath, buffer);

        res.json({
            message: 'File uploaded successfully',
            file: {
                originalName: originalname,
                fileName: fileName,
                size: size,
                mimetype: mimetype,
                path: filePath
            }
        });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ 
            message: 'File upload failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get uploaded files list
router.get('/files', authenticateToken, (req, res) => {
    try {
        const uploadsDir = path.join(__dirname, '../data/uploads');
        
        if (!fs.existsSync(uploadsDir)) {
            return res.json({ files: [] });
        }

        const files = fs.readdirSync(uploadsDir).map(fileName => {
            const filePath = path.join(uploadsDir, fileName);
            const stats = fs.statSync(filePath);
            
            return {
                fileName,
                size: stats.size,
                uploadDate: stats.mtime,
                isFile: stats.isFile()
            };
        }).filter(file => file.isFile);

        res.json({ files });
    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({ 
            message: 'Failed to get files',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Download file
router.get('/files/:fileName', authenticateToken, (req, res) => {
    try {
        const { fileName } = req.params;
        const filePath = path.join(__dirname, '../data/uploads', fileName);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        res.download(filePath);
    } catch (error) {
        console.error('File download error:', error);
        res.status(500).json({ 
            message: 'File download failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Delete file
router.delete('/files/:fileName', authenticateToken, (req, res) => {
    try {
        const { fileName } = req.params;
        const filePath = path.join(__dirname, '../data/uploads', fileName);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        fs.unlinkSync(filePath);
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('File delete error:', error);
        res.status(500).json({ 
            message: 'File delete failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
