import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  Typography,
  CircularProgress,
  IconButton,
  Container,
  Box,
  Button,
  Paper,
  Alert,
  Snackbar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getPatient, getAnesthesiaPlan, updateAnesthesiaPlan } from '../services/patients';
import { Patient, AnesthesiaPlan } from '../types';
import { useAuth } from '../contexts/AuthContext';
import AnesthesiaPlanForm from '../components/AnesthesiaPlanForm';

const AnesthesiaPlanEdit: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [anesthesiaPlan, setAnesthesiaPlan] = useState<AnesthesiaPlan | null>(null);

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
        
        // Fetch anesthesia plan if it exists
        const planData = await getAnesthesiaPlan(patientId);
        setAnesthesiaPlan(planData);
        
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

  const handleSave = async (planData: Omit<AnesthesiaPlan, 'id'>) => {
    if (!patientId || !currentUser) {
      setError('Missing patient information or user not authenticated.');
      return;
    }
    
    try {
      setSaving(true);
      setError(''); // Clear any previous errors
      
      // Add complete information to the plan
      const completeData: Omit<AnesthesiaPlan, 'id'> = {
        ...planData,
        patientId,
        createdBy: currentUser?.displayName || currentUser?.email || currentUser?.uid || 'unknown',
        tidalVolume: planData.tidalVolume || calculateTidalVolume(patient?.weight || ''),
        respRate: planData.respRate || '10-20',
        postOpPlan: planData.postOpPlan || '',
        planApproval: planData.planApproval || ''
      };
      
      await updateAnesthesiaPlan(patientId, completeData);
      setSuccess(true);
      
      // Redirect back to patient page after a short delay
      setTimeout(() => {
        navigate(`/patients/${patientId}`);
      }, 1500);
    } catch (err) {
      console.error('Error saving anesthesia plan:', err);
      if (err instanceof Error) {
        setError(`Failed to save anesthesia plan: ${err.message}`);
      } else {
        setError('Failed to save anesthesia plan. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Create a new plan if none exists
  const createNewPlan = (): Omit<AnesthesiaPlan, 'id'> => {
    return {
      patientId: patientId || '',
      premedications: [],
      inductionAgents: [],
      maintenance: '',
      ivFluids: [],
      cris: [],
      otherTechniques: [],
      totalBloodVolume: calculateBloodVolume(patient?.weight || ''),
      ventilator: false,
      emergencyDrugs: [],
      tidalVolume: calculateTidalVolume(patient?.weight || ''),
      respRate: '10-20',
      recoveryArea: 'Anesthesia',
      monitoringPlan: {
        spo2: true,
        temp: true,
        ecg: true,
        etco2: true,
        ibp: false,
        nibp: false,
        doppler: false,
        arterialLine: false,
        centralLine: false,
        ivcs: {
          longTerm: false,
          shortTerm: true,
          secondIV: false,
        },
      },
      postOpPlan: '',
      planApproval: '',
      createdBy: currentUser?.displayName || currentUser?.email || currentUser?.uid || 'unknown',
      createdAt: new Date(),
    };
  };

  // Helper function to calculate estimated blood volume based on weight
  const calculateBloodVolume = (weight: string): string => {
    try {
      const weightNum = parseFloat(weight);
      if (isNaN(weightNum)) return '';
      
      // Approximate blood volume (90ml/kg for dogs, adjust as needed)
      const bloodVolumeML = Math.round(weightNum * 90);
      return bloodVolumeML.toString();
    } catch (e) {
      return '';
    }
  };

  // Helper function to calculate tidal volume based on weight
  const calculateTidalVolume = (weight: string): string => {
    try {
      const weightNum = parseFloat(weight);
      if (isNaN(weightNum)) return '';
      
      // Calculate tidal volume range (10-20 ml/kg)
      const minTV = Math.round(weightNum * 10);
      const maxTV = Math.round(weightNum * 20);
      return `${minTV}-${maxTV}`;
    } catch (e) {
      return '';
    }
  };

  if (!patientId) {
    return <Navigate to="/patients" />;
  }

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error && !patient) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">{error}</Alert>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Button variant="contained" onClick={handleBackClick}>
              Go Back
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  // Get initial plan data - either existing plan or create a new empty one
  const initialPlanData = anesthesiaPlan || createNewPlan();

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={handleBackClick} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {patient ? `Anesthesia Plan for ${patient.name}` : 'Anesthesia Plan'}
          </Typography>
        </Box>
        
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1">
            Species/Breed: {patient?.species}/{patient?.breed} &nbsp;|&nbsp; 
            Weight: {patient?.weight} kg
          </Typography>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Anesthesia Plan Form */}
        <AnesthesiaPlanForm
          initialPlan={{
            ...initialPlanData,
          } as Omit<AnesthesiaPlan, 'id'>}
          onSave={handleSave}
          patientWeight={patient?.weight || '0'}
          isLoading={saving}
        />
      </Box>
      
      <Snackbar 
        open={success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Anesthesia plan saved successfully!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AnesthesiaPlanEdit; 