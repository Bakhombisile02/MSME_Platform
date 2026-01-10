/**
 * Firebase-based Axios Instance for CMS Admin Panel
 * 
 * Replaces localStorage token with Firebase Auth
 */

import axios from 'axios';
import Swal from 'sweetalert2';
import { auth } from '../lib/firebase';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://us-central1-msmesite-53367.cloudfunctions.net/api',
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

// Get base path for redirects
const getLoginPath = () => {
  const basePath = import.meta.env.BASE_URL || '/';
  return basePath.endsWith('/') ? `${basePath}login` : `${basePath}/login`;
};

// Response interceptor - handle errors with SweetAlert
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const originalRequest = error.config;

      // Handle 401 - unauthorized
      if (status === 401) {
        // Check if already retried to prevent infinite loop
        if (originalRequest._retry) {
          // Already retried, sign out and redirect
          await auth.signOut();
          window.location.href = getLoginPath();
          return Promise.reject(error);
        }
        
        // Mark as retried
        originalRequest._retry = true;
        
        // Check if user is signed in
        const currentUser = auth.currentUser;
        if (!currentUser) {
          // No user session - show session expired and redirect
          Swal.fire({
            icon: 'warning',
            title: 'Session Expired',
            text: 'Your session has expired. Please log in again.',
            confirmButtonText: 'Login',
            confirmButtonColor: '#3085d6',
            allowOutsideClick: false,
          }).then(() => {
            auth.signOut();
            window.location.href = getLoginPath();
          });
          return Promise.reject(error);
        }
        
        try {
          // Try to refresh token
          const newToken = await currentUser.getIdToken(true);
          
          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Show session expired alert
          Swal.fire({
            icon: 'warning',
            title: 'Session Expired',
            text: 'Your session has expired. Please log in again.',
            confirmButtonText: 'Login',
            confirmButtonColor: '#3085d6',
            allowOutsideClick: false,
          }).then(() => {
            auth.signOut();
            window.location.href = getLoginPath();
          });
        }
        return Promise.reject(error);
      }

      // Handle 403 - forbidden
      if (status === 403) {
        Swal.fire({
          icon: 'error',
          title: 'Access Denied',
          text: data.message || 'You do not have permission to perform this action.',
          confirmButtonColor: '#3085d6',
        });
      }

      // Handle 404 - not found
      if (status === 404) {
        console.error('Resource not found:', error.config.url);
      }

      // Handle 422 - validation error
      if (status === 422) {
        const validationErrors = data.errors || [];
        // Use text instead of html to prevent XSS
        const errorMessages = validationErrors
          .map(err => err.msg || err.message)
          .join('\n');

        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: errorMessages || data.message || 'Please check your input.',
          confirmButtonColor: '#3085d6',
        });
      }

      // Handle 500 - server error
      if (status >= 500) {
        Swal.fire({
          icon: 'error',
          title: 'Server Error',
          text: 'Something went wrong. Please try again later.',
          confirmButtonColor: '#3085d6',
        });
      }
    } else if (error.request) {
      // Network error
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Unable to connect to the server. Please check your internet connection.',
        confirmButtonColor: '#3085d6',
      });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
