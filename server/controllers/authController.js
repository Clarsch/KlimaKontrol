const jwt = require('jsonwebtoken');
const users = require('../config/data/users');
const JWT_SECRET = 'your-secret-key'; // In production, this should be in environment variables

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    if (!users[username]) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    if (users[username].password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { 
        username,
        role: users[username].role,
        locations: users[username].locations || []
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        username,
        role: users[username].role,
        locations: users[username].locations || []
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}; 