import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Chip,
  Button,
  Stack,
  Card,
  CardHeader,
  CardContent,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getPatient, getVitalSigns, getMedications, getPatientHistory } from '../services/patients';
import { Patient, VitalSign, Medication, PatientHistory } from '../types';
import { VitalSignsChart } from '../components/VitalSignsChart';
import { MedicationList } from '../components/MedicationList';
import { PatientHistoryList } from '../components/PatientHistoryList';
import { VitalSignForm } from '../components/VitalSignForm';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`patient-tabpanel-${index}`}
      aria-labelledby={`patient-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

export const PatientDetail: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [history, setHistory] = useState<PatientHistory[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  const fetchPatientData = async () => {
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
      
      // Fetch vital signs
      const vitalSignsData = await getVitalSigns(patientId);
      setVitalSigns(vitalSignsData);
      
      // Fetch medications
      const medicationsData = await getMedications(patientId);
      setMedications(medicationsData);
      
      // Fetch patient history
      const historyData = await getPatientHistory(patientId);
      setHistory(historyData);
      
      setError('');
    } catch (err) {
      console.error('Error fetching patient data:', err);
      setError('Failed to load patient data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleBackClick = () => {
    navigate('/patients');
  };

  const handleVitalSignAdded = () => {
    // Refresh the vital signs data
    if (patientId) {
      fetchPatientData();
    }
  };

  if (!patientId) {
    return <Navigate to="/patients" />;
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={handleBackClick} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Patient Details
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
      ) : patient ? (
        <>
          <Paper sx={{ mb: 3, p: 3 }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h5" component="h2">
                  {patient.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Chip 
                    label={patient.status} 
                    color={patient.status === 'Active' ? 'success' : 'default'}
                  />
                  <Chip label={patient.species} color="primary" />
                </Box>
              </Box>
              <Box>
                <Typography variant="body1">
                  <strong>Client ID:</strong> {patient.clientId}
                </Typography>
                <Typography variant="body1">
                  <strong>Breed:</strong> {patient.breed}
                </Typography>
                <Typography variant="body1">
                  <strong>Age:</strong> {patient.age}
                </Typography>
                <Typography variant="body1">
                  <strong>Weight:</strong> {patient.weight}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Box sx={{ width: '100%' }}>
            <Paper sx={{ mb: 3 }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange} 
                variant="fullWidth"
                textColor="primary"
                indicatorColor="primary"
              >
                <Tab label="Vital Signs" />
                <Tab label="Medications" />
                <Tab label="Patient History" />
              </Tabs>
              
              <TabPanel value={activeTab} index={0}>
                {/* Add Vital Signs Form */}
                <VitalSignForm patientId={patientId} onVitalSignAdded={handleVitalSignAdded} />
                
                <Card>
                  <CardHeader title="Anesthesia Monitoring" />
                  <Divider />
                  <CardContent sx={{ 
                    p: 0, 
                    width: '100%',
                    display: 'flex',
                    "& .MuiBox-root": {
                      width: '100%'
                    }
                  }}>
                    {vitalSigns.length > 0 ? (
                      <VitalSignsChart vitalSigns={vitalSigns} />
                    ) : (
                      <Typography sx={{ p: 2 }}>No vital signs data available</Typography>
                    )}
                  </CardContent>
                </Card>
              </TabPanel>
              
              <TabPanel value={activeTab} index={1}>
                <Card>
                  <CardHeader 
                    title="Medications" 
                    action={
                      <Button 
                        variant="contained" 
                        size="small"
                        onClick={() => navigate(`/patients/${patientId}/medications/new`)}
                      >
                        Add Medication
                      </Button>
                    }
                  />
                  <Divider />
                  <CardContent>
                    {medications.length > 0 ? (
                      <MedicationList medications={medications} patientId={patientId} />
                    ) : (
                      <Typography>No medications data available</Typography>
                    )}
                  </CardContent>
                </Card>
              </TabPanel>
              
              <TabPanel value={activeTab} index={2}>
                <Card>
                  <CardHeader 
                    title="Patient History" 
                    action={
                      <Button 
                        variant="contained" 
                        size="small"
                        onClick={() => navigate(`/patients/${patientId}/history/new`)}
                      >
                        Add History Entry
                      </Button>
                    }
                  />
                  <Divider />
                  <CardContent>
                    {history.length > 0 ? (
                      <PatientHistoryList history={history} />
                    ) : (
                      <Typography>No history data available</Typography>
                    )}
                  </CardContent>
                </Card>
              </TabPanel>
            </Paper>
          </Box>
        </>
      ) : (
        <Typography>Patient not found</Typography>
      )}
    </Box>
  );
}; 