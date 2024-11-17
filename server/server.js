const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');

const app = express();

// CORS configuration - More explicit configuration
const corsOptions = {
  origin: 'http://localhost:5173', // Vite client
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};

// Apply CORS before any routes
app.use(cors(corsOptions));
app.use(express.json());

// Add preflight handling
app.options('*', cors(corsOptions)); // Enable preflight for all routes

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);

// Try different ports if the default one is in use
const startServer = (port) => {
  try {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is busy, trying ${port + 1}`);
        startServer(port + 1);
      } else {
        console.error('Server error:', err);
      }
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
};

const PORT = process.env.PORT || 5000;
startServer(PORT); 