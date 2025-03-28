import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  Typography,
  Paper,
  CircularProgress,
  IconButton,
  Container,
  Box
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getPatient, getMedicalSummary } from '../services/patients';
import { Patient, MedicalSummary } from '../types';
import MedicalSummaryForm from '../components/MedicalSummaryForm';

const MedicalSummaryEdit: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medicalSummary, setMedicalSummary] = useState<MedicalSummary | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!patientId) return;

      try {
        setLoading(true);
        
        // Fetch patient details
        const patientData = await getPatient(patientId);
        if (!patientData) {
          setError('Patient not found');
          setLoading(false);
          return;
        }
        setPatient(patientData);
        
        // Fetch medical summary if it exists
        const summaryData = await getMedicalSummary(patientId);
        setMedicalSummary(summaryData);
        
        setError('');
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId]);

  const handleBackClick = () => {
    navigate(`/patients/${patientId}`);
  };

  const handleSave = () => {
    // This will be called after the medical summary is saved
    // The form handles the actual navigation, but this could be used
    // to trigger additional actions if needed
  };

  if (!patientId) {
    return <Navigate to="/patients" />;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={handleBackClick} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {patient ? `Edit Medical Summary for ${patient.name}` : 'Edit Medical Summary'}
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        ) : (
          <MedicalSummaryForm 
            patientId={patientId} 
            initialSummary={medicalSummary}
            onSave={handleSave}
          />
        )}
      </Box>
    </Container>
  );
};

export default MedicalSummaryEdit; 