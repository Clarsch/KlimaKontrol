const express = require('express');
const router = express.Router();
const users = require('../config/data/users');
const jwt = require('jsonwebtoken');

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Find user
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Create token with correct role
  const token = jwt.sign(
    { 
      userId: user.username,
      role: user.role,
      areas: user.areas,
      locations: user.locations
    },
    'your-secret-key',
    { expiresIn: '24h' }
  );

  // Send response
  res.json({
    token,
    user: {
      username: user.username,
      role: user.role,
      areas: user.areas,
      locations: user.locations
    }
  });
});

module.exports = router; 