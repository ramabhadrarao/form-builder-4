// client/src/lib/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

console.log('API Base URL:', API_BASE_URL); // Debug log

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url); // Debug log
    
    // Add timestamp to prevent caching for GET requests
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url); // Debug log
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data || error.message);
    
    // Handle network errors
    if (!error.response) {
      error.message = 'Network error. Please check your connection and ensure the server is running.';
    }
    
    // Handle specific error codes
    if (error.response?.status === 403) {
      error.message = 'Access denied. You do not have permission to perform this action.';
    }
    
    if (error.response?.status >= 500) {
      error.message = 'Server error. Please try again later.';
    }
    
    return Promise.reject(error);
  }
);

export default api;