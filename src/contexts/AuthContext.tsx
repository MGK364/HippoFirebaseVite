import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { onAuthStateChange, signIn, signOut, getCurrentUser } from '../services/auth';

// Define the context type
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  login: () => Promise.reject('AuthContext not initialized'),
  logout: () => Promise.reject('AuthContext not initialized')
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Effect to listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    const user = await signIn(email, password);
    setCurrentUser(user);
    return user;
  };

  // Logout function
  const logout = async () => {
    await signOut();
    setCurrentUser(null);
  };

  // Context value
  const value = {
    currentUser,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 