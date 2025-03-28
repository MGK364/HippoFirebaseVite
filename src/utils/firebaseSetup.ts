import { db } from '../services/firebase';
import { collection, doc, setDoc, getDoc, getDocs } from 'firebase/firestore';
import { User } from '../types';

/**
 * Initializes the basic structure for a new Firebase database
 * This should be run when setting up the application for the first time
 */
export const initializeFirebaseDatabase = async (currentUser: User): Promise<boolean> => {
  try {
    console.log('Starting Firebase database initialization...');
    
    // Check if we've already initialized the database
    const settingsRef = doc(db, 'settings', 'dbInitialized');
    const settingsDoc = await getDoc(settingsRef);
    
    if (settingsDoc.exists()) {
      console.log('Database already initialized, skipping setup');
      return true;
    }
    
    // Create required collections with an initial document
    
    // Initialize clinics collection
    const clinicRef = doc(db, 'clinics', 'default');
    await setDoc(clinicRef, {
      name: 'Default Clinic',
      address: '123 Animal Care Lane',
      phone: '555-123-4567',
      email: 'info@vetclinic.com',
      createdAt: new Date(),
      createdBy: currentUser.uid
    });
    
    // Initialize roles collection
    const adminRoleRef = doc(db, 'roles', 'admin');
    await setDoc(adminRoleRef, {
      name: 'Administrator',
      permissions: ['read', 'write', 'delete', 'manage_users'],
      createdAt: new Date()
    });
    
    const vetRoleRef = doc(db, 'roles', 'veterinarian');
    await setDoc(vetRoleRef, {
      name: 'Veterinarian',
      permissions: ['read', 'write', 'delete'],
      createdAt: new Date()
    });
    
    const techRoleRef = doc(db, 'roles', 'technician');
    await setDoc(techRoleRef, {
      name: 'Technician',
      permissions: ['read', 'write'],
      createdAt: new Date()
    });
    
    // Initialize users collection for the current user
    const userRef = doc(db, 'users', currentUser.uid);
    await setDoc(userRef, {
      email: currentUser.email,
      displayName: currentUser.displayName || 'New User',
      role: 'admin', // First user is admin by default
      clinicId: 'default',
      createdAt: new Date()
    });
    
    // Set the initialization flag
    await setDoc(settingsRef, {
      initialized: true,
      timestamp: new Date(),
      initializedBy: currentUser.uid
    });
    
    console.log('Database initialization completed successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
};

/**
 * Checks if the current user has an entry in the users collection
 * If not, creates one with default settings
 */
export const ensureUserDocumentExists = async (currentUser: User): Promise<void> => {
  if (!currentUser?.uid) return;
  
  try {
    const userRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Create a new user document
      await setDoc(userRef, {
        email: currentUser.email,
        displayName: currentUser.displayName || 'New User',
        role: 'technician', // Default role for new users
        clinicId: 'default',
        createdAt: new Date()
      });
      console.log('Created new user document for:', currentUser.email);
    }
  } catch (error) {
    console.error('Error ensuring user document exists:', error);
  }
}; 