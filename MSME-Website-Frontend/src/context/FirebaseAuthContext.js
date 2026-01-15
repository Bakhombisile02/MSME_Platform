/**
 * Firebase Auth Context for MSME Website
 * 
 * Replaces JWT-based authentication with Firebase Auth
 */

"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '@/lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get business profile from Firestore
          const businessDoc = await getDoc(doc(db, 'msme_businesses', firebaseUser.uid));
          
          if (businessDoc.exists()) {
            const businessData = businessDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: businessData.name_of_organization,
            });
            setBusiness(businessData);
          } else {
            // User exists in Auth but not in Firestore (edge case)
            console.warn('User authenticated but no business profile found - signing out');
            try {
              await signOut(auth);
            } catch (signOutError) {
              console.error('Error signing out user without profile:', signOutError);
            }
            setUser(null);
            setBusiness(null);
          }
        } catch (err) {
          console.error('Error fetching business profile:', err);
          setError(err.message);
        }
      } else {
        setUser(null);
        setBusiness(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Sign in with email and password
   * Note: For businesses, we use a Cloud Function to validate and sign in
   * because passwords are stored in Firestore, not Firebase Auth
   */
  const signIn = async (email, password) => {
    setError(null);
    setLoading(true);

    try {
      // Call Cloud Function to validate business login
      const loginFn = httpsCallable(functions, 'api');
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/msme-business/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Sign in with custom token from Cloud Function
      if (data.customToken) {
        const { signInWithCustomToken } = await import('firebase/auth');
        await signInWithCustomToken(auth, data.customToken);
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign out
   */
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setBusiness(null);
    } catch (err) {
      console.error('Sign out error:', err);
      throw err;
    }
  };

  /**
   * Send password reset OTP
   */
  const requestPasswordReset = async (email) => {
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/msme-business/forget-password/request-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Verify OTP and reset password
   */
  const resetPassword = async (email, otp, newPassword) => {
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/msme-business/forget-password/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp, new_password: newPassword }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Change password (when logged in)
   */
  const changePassword = async (currentPassword, newPassword) => {
    setError(null);

    if (!user) {
      throw new Error('Not authenticated');
    }

    // Verify auth.currentUser exists before getting token
    if (!auth.currentUser) {
      throw new Error('No authenticated session. Please log in again.');
    }

    try {
      const token = await auth.currentUser.getIdToken();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/msme-business/change-password`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            current_password: currentPassword, 
            new_password: newPassword 
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Update business profile
   */
  const updateProfile = async (updates) => {
    setError(null);

    if (!user) {
      throw new Error('Not authenticated');
    }

    // Verify business and business.id exist
    if (!business || !business.id) {
      console.error('updateProfile failed: business or business.id is missing');
      throw new Error('No business profile found. Please refresh and try again.');
    }

    // Verify auth.currentUser exists before getting token
    if (!auth.currentUser) {
      throw new Error('No authenticated session. Please log in again.');
    }

    try {
      const token = await auth.currentUser.getIdToken();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/msme-business/${business.id}`,
        {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update local state
      setBusiness(prev => ({ ...prev, ...updates }));

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Get auth token for API calls
   */
  const getToken = async () => {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  };

  const value = {
    user,
    business,
    loading,
    error,
    isAuthenticated: !!user,
    signIn,
    signOut,
    requestPasswordReset,
    resetPassword,
    changePassword,
    updateProfile,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
