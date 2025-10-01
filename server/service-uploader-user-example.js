// Add this user entry to your klima_kontrol_config/server/data/users.js file
// Place it at the beginning of the users array, after the admin user

{
  username: "data-provider-service",
  name: "Data Provider Service",
  password: "secure-service-password-2024", // Change this to a secure password
  role: "service_uploader",
  areas: [1, 2, 3, 4], // Full access to all areas
  locations: locations.map(loc => loc.id) // Full access to all locations
}
