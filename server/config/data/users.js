const users = {
  admin: { 
    password: "password123", 
    role: "admin",
    areas: ["Aabenraa Sogn", "Haderslev Sogn", "Tønder Sogn", "Sønderborg Sogn"]
  },
  michael: { 
    password: "password123", 
    role: "monitoring",
    areas: ["Aabenraa Sogn", "Haderslev Sogn", "Tønder Sogn", "Sønderborg Sogn"]
  },
  aabenraa: { 
    password: "password123", 
    role: "collector", 
    locations: ["Aabenraa Sankt Nicolai Kirke"] 
  },
  bov: { 
    password: "password123", 
    role: "collector", 
    locations: ["Bov Kirke"] 
  },
  haderslev: { 
    password: "password123", 
    role: "collector", 
    locations: ["Haderslev Domkirke"] 
  },
  padborg: { 
    password: "password123", 
    role: "collector", 
    locations: ["Holbøl Kirke"] 
  },
  rise: { 
    password: "password123", 
    role: "collector", 
    locations: ["Rise Kirke"] 
  }
};

module.exports = users; 