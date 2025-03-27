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
  IconButton,
  Collapse
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import { getPatient, getVitalSigns, getMedications, getPatientHistory, addVitalSign } from '../services/patients';
import { Patient, VitalSign, Medication, PatientHistory } from '../types';
import { VitalSignsChart } from '../components/VitalSignsChart';
import { MedicationList } from '../components/MedicationList';
import { PatientHistoryList } from '../components/PatientHistoryList';
import { AddVitalSigns } from './AddVitalSigns';

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
  const [showAddVitalSigns, setShowAddVitalSigns] = useState(false);

  const fetchVitalSigns = async () => {
    if (!patientId) return;
    
    try {
      const vitalSignsData = await getVitalSigns(patientId);
      setVitalSigns(vitalSignsData);
    } catch (err) {
      console.error('Error fetching vital signs:', err);
    }
  };

  useEffect(() => {
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
        await fetchVitalSigns();
        
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

    fetchPatientData();
  }, [patientId]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleBackClick = () => {
    navigate('/patients');
  };

  const handleToggleAddVitalSigns = () => {
    setShowAddVitalSigns(!showAddVitalSigns);
  };

  const handleVitalSignsAdded = async () => {
    // Refresh vital signs data
    await fetchVitalSigns();
    // Hide the form
    setShowAddVitalSigns(false);
  };

  const handleNavigateToMonitoring = () => {
    if (patientId) {
      navigate(`/patients/${patientId}/monitoring`);
    }
  };

  if (!patientId) {
    return <Navigate to="/patients" />;
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleBackClick} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Patient Details
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<MonitorHeartIcon />}
          onClick={handleNavigateToMonitoring}
        >
          Monitoring
        </Button>
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
                <Tab label="History" />
                <Tab label="Documents" />
              </Tabs>
              
              <TabPanel value={activeTab} index={0}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    onClick={handleToggleAddVitalSigns}
                    endIcon={showAddVitalSigns ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  >
                    {showAddVitalSigns ? 'Hide Form' : 'Add Vital Signs'}
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    onClick={handleNavigateToMonitoring}
                    startIcon={<MonitorHeartIcon />}
                    sx={{ ml: 2 }}
                  >
                    Live Monitoring
                  </Button>
                </Box>
                
                <Collapse in={showAddVitalSigns}>
                  <Box sx={{ mb: 3 }}>
                    <AddVitalSigns 
                      patientId={patientId} 
                      onVitalSignsAdded={handleVitalSignsAdded}
                      inline
                    />
                  </Box>
                </Collapse>
                
                {vitalSigns.length > 0 ? (
                  <VitalSignsChart vitalSigns={vitalSigns} height={400} />
                ) : (
                  <Typography>No vital signs recorded yet.</Typography>
                )}
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