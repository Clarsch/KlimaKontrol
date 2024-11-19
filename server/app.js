const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');

const app = express();

// Ensure required directories exist
const createRequiredDirectories = () => {
  const directories = [
    'data',
    'data/uploads',
    'data/warnings',
    'data/environmental'
  ];

  directories.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
      console.log(`Creating directory: ${fullPath}`);
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });

  // Ensure warnings.json exists
  const warningsFile = path.join(__dirname, 'data', 'warnings', 'warnings.json');
  if (!fs.existsSync(warningsFile)) {
    console.log(`Creating warnings file: ${warningsFile}`);
    fs.writeFileSync(warningsFile, JSON.stringify({}), 'utf8');
  }
};

// Create directories on server start
createRequiredDirectories();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

module.exports = app;