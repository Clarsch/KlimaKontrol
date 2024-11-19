const users = [
  // Demo monitor user with access to all areas and locations
  {
    username: 'demo',
    password: 'demo123',
    role: 'monitoring',
    areas: [1, 2, 3, 4],
    locations: [
      "Los Angeles", "San Francisco", "San Diego", "Sacramento", "San Jose",
      "Houston", "Austin", "Dallas", "San Antonio", "Fort Worth",
      "Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale",
      "New York City", "Buffalo", "Rochester", "Syracuse", "Albany"
    ]
  },

  // Admin user
  {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    areas: [1, 2, 3, 4],
    locations: [
      "Los Angeles", "San Francisco", "San Diego", "Sacramento", "San Jose",
      "Houston", "Austin", "Dallas", "San Antonio", "Fort Worth",
      "Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale",
      "New York City", "Buffalo", "Rochester", "Syracuse", "Albany"
    ]
  },

  // California collectors
  {
    username: 'los_angeles_collector',
    password: 'collector123',
    role: 'collector',
    areas: [1],
    locations: ['Los Angeles']
  },
  {
    username: 'san_francisco_collector',
    password: 'collector123',
    role: 'collector',
    areas: [1],
    locations: ['San Francisco']
  },
  {
    username: 'san_diego_collector',
    password: 'collector123',
    role: 'collector',
    areas: [1],
    locations: ['San Diego']
  },
  {
    username: 'sacramento_collector',
    password: 'collector123',
    role: 'collector',
    areas: [1],
    locations: ['Sacramento']
  },
  {
    username: 'san_jose_collector',
    password: 'collector123',
    role: 'collector',
    areas: [1],
    locations: ['San Jose']
  },

  // Texas collectors
  {
    username: 'houston_collector',
    password: 'collector123',
    role: 'collector',
    areas: [2],
    locations: ['Houston']
  },
  {
    username: 'austin_collector',
    password: 'collector123',
    role: 'collector',
    areas: [2],
    locations: ['Austin']
  },
  {
    username: 'dallas_collector',
    password: 'collector123',
    role: 'collector',
    areas: [2],
    locations: ['Dallas']
  },
  {
    username: 'san_antonio_collector',
    password: 'collector123',
    role: 'collector',
    areas: [2],
    locations: ['San Antonio']
  },
  {
    username: 'fort_worth_collector',
    password: 'collector123',
    role: 'collector',
    areas: [2],
    locations: ['Fort Worth']
  },

  // Florida collectors
  {
    username: 'miami_collector',
    password: 'collector123',
    role: 'collector',
    areas: [3],
    locations: ['Miami']
  },
  {
    username: 'orlando_collector',
    password: 'collector123',
    role: 'collector',
    areas: [3],
    locations: ['Orlando']
  },
  {
    username: 'tampa_collector',
    password: 'collector123',
    role: 'collector',
    areas: [3],
    locations: ['Tampa']
  },
  {
    username: 'jacksonville_collector',
    password: 'collector123',
    role: 'collector',
    areas: [3],
    locations: ['Jacksonville']
  },
  {
    username: 'fort_lauderdale_collector',
    password: 'collector123',
    role: 'collector',
    areas: [3],
    locations: ['Fort Lauderdale']
  },

  // New York collectors
  {
    username: 'nyc_collector',
    password: 'collector123',
    role: 'collector',
    areas: [4],
    locations: ['New York City']
  },
  {
    username: 'buffalo_collector',
    password: 'collector123',
    role: 'collector',
    areas: [4],
    locations: ['Buffalo']
  },
  {
    username: 'rochester_collector',
    password: 'collector123',
    role: 'collector',
    areas: [4],
    locations: ['Rochester']
  },
  {
    username: 'syracuse_collector',
    password: 'collector123',
    role: 'collector',
    areas: [4],
    locations: ['Syracuse']
  },
  {
    username: 'albany_collector',
    password: 'collector123',
    role: 'collector',
    areas: [4],
    locations: ['Albany']
  },

  // Area monitor users
  {
    username: 'california_monitor',
    password: 'monitor123',
    role: 'monitoring',
    areas: [1],
    locations: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose']
  },
  {
    username: 'texas_monitor',
    password: 'monitor123',
    role: 'monitoring',
    areas: [2],
    locations: ['Houston', 'Austin', 'Dallas', 'San Antonio', 'Fort Worth']
  },
  {
    username: 'florida_monitor',
    password: 'monitor123',
    role: 'monitoring',
    areas: [3],
    locations: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale']
  },
  {
    username: 'newyork_monitor',
    password: 'monitor123',
    role: 'monitoring',
    areas: [4],
    locations: ['New York City', 'Buffalo', 'Rochester', 'Syracuse', 'Albany']
  }
];

module.exports = users; 