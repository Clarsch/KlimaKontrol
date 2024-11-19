const users = {
  admin: { 
    name: "Admin",
    password: "password123", 
    role: "admin",
    areas: ["Aabenraa Sogn", "Haderslev Sogn", "Tønder Sogn", "Sønderborg Sogn"]
  },
  michael: { 
    name: "Michael",
    password: "password123", 
    role: "monitoring",
    areas: ["Aabenraa Sogn", "Haderslev Sogn", "Tønder Sogn", "Sønderborg Sogn"]
  },
  aabenraa: { 
    name: "Aabenraa",
    password: "password123", 
    role: "collector", 
    locations: ["Aabenraa Sankt Nicolai Kirke"] 
  },
  bov: { 
    name: "Bov",
    password: "password123", 
    role: "collector", 
    locations: ["Bov Kirke"] 
  },
  haderslev: { 
    name: "Haderslev",
    password: "password123", 
    role: "collector", 
    locations: ["Haderslev Domkirke"] 
  },
  padborg: { 
    name: "Padborg",
    password: "password123", 
    role: "collector", 
    locations: ["Holbøl Kirke"] 
  },
  rise: { 
    name: "Rise",
    password: "password123", 
    role: "collector", 
    locations: ["Rise Kirke"] 
  }
};

module.exports = users; 