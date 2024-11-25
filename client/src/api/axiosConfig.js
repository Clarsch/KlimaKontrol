import axios from 'axios';

// Create axios instance with base configuration
const axiosInstance = axios.create({
  // Use the VITE_API_URL environment variable, or fall back to relative path
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
});

export default axiosInstance; 