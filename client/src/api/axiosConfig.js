import axios from 'axios';

// Create axios instance with base configuration
const axiosInstance = axios.create({
  // Use the VITE_API_URL environment variable, or fall back to relative path
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
  withCredentials: true, // Enable sending cookies with requests
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true' // For ngrok development
  }
});

// Request interceptor for automatic authentication
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    console.log('Outgoing request:', {
      method: config.method,
      url: config.url,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for debugging and token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('Response received:', {
      status: response.status,
      headers: response.headers,
      data: response.data
    });
    return response;
  },
  async (error) => {
    console.error('Response error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: error.config
    });

    const originalRequest = error.config;

    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const response = await axiosInstance.post('/api/auth/refresh');
        const newAccessToken = response.data.accessToken;
        
        // Update the original request's authorization header
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        
        // Update localStorage
        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('token', newAccessToken);
        
        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear auth state and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance; 