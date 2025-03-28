import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, CircularProgress, Alert } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PatientForm from '../components/PatientForm';
import { getPatient } from '../services/patients';
import { Patient } from '../types';

const EditPatient: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatient = async () => {
      if (!patientId) {
        setError('Patient ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const patientData = await getPatient(patientId);
        if (!patientData) {
          setError('Patient not found');
        } else {
          setPatient(patientData);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching patient:', err);
        setError('Failed to load patient data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [patientId]);

  const handlePatientUpdated = () => {
    // Navigate back to patient details after a short delay to show success message
    setTimeout(() => {
      navigate(`/patients/${patientId}`);
    }, 1500);
  };

  const handleBackClick = () => {
    navigate(`/patients/${patientId}`);
  };

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackClick}
          sx={{ mr: 2 }}
        >
          Back to Patient
        </Button>
        <Typography variant="h4">Edit Patient</Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : patient ? (
        <PatientForm 
          onPatientAdded={handlePatientUpdated} 
          initialPatient={patient}
          isEditing={true}
        />
      ) : null}
    </Box>
  );
};

export default EditPatient; 