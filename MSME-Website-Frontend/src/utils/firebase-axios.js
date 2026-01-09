/**
 * Firebase-based Axios Instance for MSME Website
 * 
 * Replaces JWT token with Firebase Auth token
 */

import axios from 'axios';
import { auth } from '@/lib/firebase';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://us-central1-msmesite-53367.cloudfunctions.net/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add Firebase Auth token
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const { status } = error.response;
      const originalRequest = error.config;

      // Handle 401 - token expired or invalid
      if (status === 401) {
        // Check if already retried to prevent infinite loop
        if (originalRequest._retry) {
          // Already retried, sign out and redirect
          await auth.signOut();
          // SSR-safe redirect
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
        
        try {
          // Mark as retried
          originalRequest._retry = true;
          
          // Try to refresh token
          const currentUser = auth.currentUser;
          if (currentUser) {
            const newToken = await currentUser.getIdToken(true); // Force refresh
            
            // Retry the original request
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          // Sign out user if refresh fails
          await auth.signOut();
          // SSR-safe redirect
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }

      // Handle 403 - forbidden
      if (status === 403) {
        console.error('Access forbidden');
      }

      // Handle 500 - server error
      if (status >= 500) {
        console.error('Server error:', error.response.data);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
