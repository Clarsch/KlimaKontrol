import { createContext, useState, useContext, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';

// Create the context
const AuthContext = createContext(null);

// Export the provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Initialize user from localStorage
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [token, setToken] = useState(() => {
    // Initialize token from localStorage
    return localStorage.getItem('accessToken') || localStorage.getItem('token');
  });

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    // Save both user data and token to localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
    localStorage.setItem('accessToken', userToken); // For compatibility
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    // Clear both user data and token from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
  };

  // Token refresh function
  const refreshToken = async () => {
    try {
      const response = await axiosInstance.post('/api/auth/refresh');
      const newToken = response.data.accessToken;
      setToken(newToken);
      localStorage.setItem('token', newToken);
      localStorage.setItem('accessToken', newToken);
      return newToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return null;
    }
  };

  // Optional: Add token expiration check and auto-refresh
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        const timeUntilExpiry = expirationTime - Date.now();
        
        if (timeUntilExpiry <= 0) {
          // Token has expired, try to refresh
          refreshToken();
        } else if (timeUntilExpiry < 5 * 60 * 1000) {
          // Token expires in less than 5 minutes, refresh it
          refreshToken();
        }
      } catch (error) {
        // Invalid token format
        logout();
      }
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Export the hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 