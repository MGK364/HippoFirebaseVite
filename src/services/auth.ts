import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from './firebase';
import { User } from '../types';

// Convert Firebase user to our app User type
const formatUser = (user: FirebaseUser | null): User | null => {
  if (!user) return null;
  
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName
  };
};

// For development purposes, we'll use a persistent user
const DEVELOPMENT_MODE = false;
const DEV_USER: User = {
  uid: 'dev-user-123',
  email: 'dev@vetclinic.com',
  displayName: 'Development User'
};

// Sign in function
export const signIn = async (email: string, password: string): Promise<User> => {
  if (DEVELOPMENT_MODE) {
    return DEV_USER;
  }
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return formatUser(userCredential.user) as User;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// Sign out function
export const signOut = async (): Promise<void> => {
  if (DEVELOPMENT_MODE) {
    console.log('Development mode: Sign out simulation');
    return;
  }
  
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Get current user function (for development, always returns dev user)
export const getCurrentUser = (): User | null => {
  if (DEVELOPMENT_MODE) {
    return DEV_USER;
  }
  
  return formatUser(auth.currentUser);
};

// Auth state listener
export const onAuthStateChange = (callback: (user: User | null) => void): () => void => {
  if (DEVELOPMENT_MODE) {
    // In development mode, immediately call with the dev user and return a no-op unsubscribe
    callback(DEV_USER);
    return () => {};
  }
  
  return onAuthStateChanged(auth, (user) => {
    callback(formatUser(user));
  });
}; 