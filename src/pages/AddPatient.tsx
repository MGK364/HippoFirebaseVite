import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { addPatient } from '../services/patients';
import { Patient } from '../types';

export const AddPatient: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      // Create patient data object
      const patientData: Omit<Patient, 'id'> = {
        name,
        clientId,
        species,
        breed,
        age,
        weight,
        status
      };
      
      // Add the patient
      const newPatient = await addPatient(patientData);
      
      setSuccess(true);
      
      // Navigate to the new patient's detail page after a short delay
      setTimeout(() => {
        navigate(`/patients/${newPatient.id}`);
      }, 1500);
      
    } catch (err) {
      console.error('Error adding patient:', err);
      setError('Failed to add patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleBackClick = () => {
    navigate('/patients');
  };
  
  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={handleBackClick} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Add New Patient
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Patient added successfully!
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
              <TextField
                label="Patient Name"
                fullWidth
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </Box>
            
            <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
              <TextField
                label="Client ID"
                fullWidth
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                disabled={loading}
                helperText="Owner's ID or reference number"
              />
            </Box>
            
            <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
              <TextField
                label="Species"
                fullWidth
                required
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                disabled={loading}
              />
            </Box>
            
            <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
              <TextField
                label="Breed"
                fullWidth
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                disabled={loading}
              />
            </Box>
            
            <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
              <TextField
                label="Age"
                fullWidth
                value={age}
                onChange={(e) => setAge(e.target.value)}
                disabled={loading}
                helperText="Years and months (e.g., '5 years 3 months')"
              />
            </Box>
            
            <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
              <TextField
                label="Weight"
                fullWidth
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                disabled={loading}
                helperText="Weight in kilograms or pounds (e.g., '5.4 kg')"
              />
            </Box>
            
            <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  label="Status"
                  onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                  disabled={loading}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ width: '100%', mt: 2 }}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={handleBackClick}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Patient'}
                </Button>
              </Stack>
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}; 