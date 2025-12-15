"use client"
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    userId: null,
    userType: null, // Added userType to track admin/user
    isLoggedIn: false,
    isLoading: true
  });

  useEffect(() => {
    // Function to check auth state
    const checkAuthState = () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        const userType = localStorage.getItem('userType'); // Get userType from localStorage
        
        if (token && userId) {
          setAuthState({
            userId: parseInt(userId),
            userType: userType || 'user', // Default to 'user' if not set
            isLoggedIn: true,
            isLoading: false
          });
        } else {
          setAuthState(prev => ({
            ...prev,
            isLoading: false
          }));
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        setAuthState(prev => ({
          ...prev,
          isLoading: false
        }));
      }
    };

    // Check auth state immediately
    checkAuthState();

    // Add event listener for storage changes
    window.addEventListener('storage', checkAuthState);

    // Cleanup
    return () => {
      window.removeEventListener('storage', checkAuthState);
    };
  }, []);

  const login = (userId, token, userType = 'user') => {
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('userType', userType); // Store userType
      setAuthState({
        userId,
        userType,
        isLoggedIn: true,
        isLoading: false
      });
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userType'); // Remove userType
      setAuthState({
        userId: null,
        userType: null,
        isLoggedIn: false,
        isLoading: false
      });
      window.location.href = '/';
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // If still loading, show a loading spinner
  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}