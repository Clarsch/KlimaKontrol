const jwt = require('jsonwebtoken');

// Updated data structure with areas
const areas = {
  "Aabenraa Sogn": [
    "Aabenraa Kirke",
    "Bov Kirke",
    "Haderslev Kirke",
    "Padborg Kirke",
    "Rise Kirke"
  ],
  "Haderslev Sogn": [],
  "Tønder Sogn": [],
  "Sønderborg Sogn": []
};

// Hardcoded users with updated structure
const users = {
  admin: { 
    password: "password123", 
    role: "admin",
    areas: Object.keys(areas)
  },
  michael: { 
    password: "password123", 
    role: "monitoring",
    areas: Object.keys(areas)
  },
  aabenraa: { 
    password: "password123", 
    role: "collector", 
    locations: ["Aabenraa Kirke"] 
  },
  bov: { 
    password: "password123", 
    role: "collector", 
    locations: ["Bov Kirke"] 
  },
  haderslev: { 
    password: "password123", 
    role: "collector", 
    locations: ["Haderslev Kirke"] 
  },
  padborg: { 
    password: "password123", 
    role: "collector", 
    locations: ["Padborg Kirke"] 
  },
  rise: { 
    password: "password123", 
    role: "collector", 
    locations: ["Rise Kirke"] 
  }
};

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