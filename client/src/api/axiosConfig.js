import axios from 'axios';

// Create axios instance with base configuration
const axiosInstance = axios.create({
  // Use the VITE_API_URL environment variable, or fall back to relative path
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'Access-Control-Allow-Origin': '*'
  },
  withCredentials: false
});

// Add request interceptor for debugging
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url, 'with headers:', config.headers);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('Response from:', response.config.url, 'Data:', response.data);
    return response;
  },
  (error) => {
    console.error('Request failed:', {
      message: error.message,
      config: error.config,
      response: error.response
    });
    return Promise.reject(error);
  }
);

export default axiosInstance; 