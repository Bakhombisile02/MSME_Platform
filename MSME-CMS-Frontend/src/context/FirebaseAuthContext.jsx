/**
 * Firebase Auth Context for CMS Admin Panel
 * 
 * Handles admin authentication using Firebase Auth with custom claims
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import Swal from 'sweetalert2';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get ID token result to check custom claims
          const idTokenResult = await firebaseUser.getIdTokenResult();
          
          // Check if user has admin claim
          if (!idTokenResult.claims.admin) {
            console.warn('User is not an admin');
            await firebaseSignOut(auth);
            setAdmin(null);
            setLoading(false);
            return;
          }

          // Get admin profile from Firestore
          const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
          
          if (adminDoc.exists()) {
            const adminData = adminDoc.data();
            setAdmin({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: `${adminData.first_name} ${adminData.last_name}`,
              role: idTokenResult.claims.role || adminData.role || 'admin',
              ...adminData,
            });
          } else {
            // Admin in Auth but not in Firestore
            setAdmin({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: idTokenResult.claims.role || 'admin',
            });
          }
        } catch (err) {
          console.error('Error fetching admin profile:', err);
          setError(err.message);
          setAdmin(null);
        }
      } else {
        setAdmin(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Sign in admin
   */
  const signIn = async (email, password) => {
    setError(null);
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idTokenResult = await userCredential.user.getIdTokenResult();

      // Verify admin claim
      if (!idTokenResult.claims.admin) {
        await firebaseSignOut(auth);
        throw new Error('Access denied. You are not authorized as an admin.');
      }

      return userCredential.user;
    } catch (err) {
      let message = 'Login failed';
      
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          message = 'Invalid email or password';
          break;
        case 'auth/too-many-requests':
          message = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/user-disabled':
          message = 'This account has been disabled';
          break;
        default:
          message = err.message;
      }

      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign out admin
   */
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setAdmin(null);
    } catch (err) {
      console.error('Sign out error:', err);
      throw err;
    }
  };

  /**
   * Send password reset email
   */
  const resetPassword = async (email) => {
    setError(null);

    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (err) {
      let message = 'Failed to send reset email';
      
      if (err.code === 'auth/user-not-found') {
        message = 'No account found with this email';
      }

      setError(message);
      throw new Error(message);
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

  /**
   * Refresh auth token
   */
  const refreshToken = async () => {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken(true);
    }
    return null;
  };

  /**
   * Check if user has specific role
   */
  const hasRole = (requiredRole) => {
    if (!admin) return false;
    if (admin.role === 'super_admin') return true;
    return admin.role === requiredRole;
  };

  const value = {
    admin,
    loading,
    error,
    isAuthenticated: !!admin,
    signIn,
    signOut,
    resetPassword,
    getToken,
    refreshToken,
    hasRole,
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
