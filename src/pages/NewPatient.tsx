import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PatientForm from '../components/PatientForm';

const NewPatient: React.FC = () => {
  const navigate = useNavigate();

  const handlePatientAdded = () => {
    // Navigate back to patients list after a short delay to show success message
    setTimeout(() => {
      navigate('/patients');
    }, 1500);
  };

  const handleBackClick = () => {
    navigate('/patients');
  };

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackClick}
          sx={{ mr: 2 }}
        >
          Back to Patients
        </Button>
        <Typography variant="h4">Add New Patient</Typography>
      </Box>

      <PatientForm onPatientAdded={handlePatientAdded} />
    </Box>
  );
};

export default NewPatient; 