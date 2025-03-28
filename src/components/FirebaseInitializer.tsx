import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Button, Alert } from '@mui/material';
import { initializeFirebaseDatabase, ensureUserDocumentExists } from '../utils/firebaseSetup';
import { useAuth } from '../contexts/AuthContext';

/**
 * Component that handles Firebase initialization when a new user logs in
 * This will set up necessary database collections and documents
 */
const FirebaseInitializer: React.FC = () => {
  const { currentUser } = useAuth();
  const [initializing, setInitializing] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure the user has a document in Firestore
  useEffect(() => {
    if (currentUser) {
      ensureUserDocumentExists(currentUser)
        .catch(err => {
          console.error('Error ensuring user exists:', err);
        });
    }
  }, [currentUser]);

  const handleInitialize = async () => {
    if (!currentUser) {
      setError('You must be logged in to initialize the database');
      return;
    }

    setInitializing(true);
    setError(null);

    try {
      const success = await initializeFirebaseDatabase(currentUser);
      if (success) {
        setInitialized(true);
      } else {
        setError('Failed to initialize the database. Check console for details.');
      }
    } catch (err) {
      console.error('Initialization error:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setInitializing(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Box sx={{ mt: 4, mb: 4, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>
        Firebase Database Setup
      </Typography>
      
      <Typography variant="body2" paragraph>
        This tool helps initialize your Firebase database with the necessary structure.
        It should be run once when setting up the application for the first time.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {initialized && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Database initialized successfully!
        </Alert>
      )}
      
      <Button
        variant="contained"
        color="primary"
        onClick={handleInitialize}
        disabled={initializing || initialized}
        sx={{ mt: 2 }}
      >
        {initializing ? (
          <>
            <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
            Initializing...
          </>
        ) : 'Initialize Database'}
      </Button>
    </Box>
  );
};

export default FirebaseInitializer; 