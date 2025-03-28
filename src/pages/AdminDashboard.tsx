import React from 'react';
import { Container, Typography, Box, Paper, Divider, Button } from '@mui/material';
import FirebaseInitializer from '../components/FirebaseInitializer';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        
        <Typography variant="body1" paragraph>
          Welcome to the administrator dashboard. Here you can manage database settings,
          user accounts, and perform system maintenance.
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Information
            </Typography>
            <Typography variant="body2">
              <strong>Current User:</strong> {currentUser?.displayName || 'Unknown'}
            </Typography>
            <Typography variant="body2">
              <strong>User Email:</strong> {currentUser?.email || 'Unknown'}
            </Typography>
            <Typography variant="body2">
              <strong>User ID:</strong> {currentUser?.uid || 'Unknown'}
            </Typography>
            <Typography variant="body2">
              <strong>Environment:</strong> {process.env.NODE_ENV}
            </Typography>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Database Setup
            </Typography>
            <FirebaseInitializer />
          </Paper>
        </Box>
        
        <Divider sx={{ my: 4 }} />
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Note: These administrative tools should only be used by authorized personnel. 
            All actions are logged for security purposes.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default AdminDashboard; 