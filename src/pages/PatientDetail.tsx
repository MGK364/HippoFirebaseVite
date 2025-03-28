import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  Typography,
  Paper,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Chip,
  Button,
  IconButton,
  Card,
  CardHeader
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { 
  getPatient, 
  getVitalSigns, 
  getMedications, 
  getPatientHistory, 
  getAnesthesiaBoluses,
  getAnesthesiaCRIs,
  getMedicalSummary,
  getAnesthesiaPlan
} from '../services/patients';
import { Patient, VitalSign, Medication, PatientHistory, AnesthesiaBolus, AnesthesiaCRI, MedicalSummary, AnesthesiaPlan } from '../types';
import { VitalSignsChart } from '../components/VitalSignsChart';
import { MedicationList } from '../components/MedicationList';
import { VitalSignForm } from '../components/VitalSignForm';
import AnesthesiaMedicationChart from '../components/AnesthesiaMedicationChart';
import MedicalSummaryView from '../components/MedicalSummaryView';
import AnesthesiaPlanView from '../components/AnesthesiaPlanView';
import { useAuth } from '../contexts/AuthContext';

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
      style={{ width: '100%' }}
    >
      {value === index && (
        <div style={{ padding: '24px', width: '100%' }}>
          {children}
        </div>
      )}
    </div>
  );
};

export const PatientDetail: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [history, setHistory] = useState<PatientHistory[]>([]);
  const [anesthesiaBoluses, setAnesthesiaBoluses] = useState<AnesthesiaBolus[]>([]);
  const [anesthesiaCRIs, setAnesthesiaCRIs] = useState<AnesthesiaCRI[]>([]);
  const [medicalSummary, setMedicalSummary] = useState<MedicalSummary | null>(null);
  const [anesthesiaPlan, setAnesthesiaPlan] = useState<AnesthesiaPlan | null>(null);
  const [medicalSummaryLoading, setMedicalSummaryLoading] = useState(true);
  const [anesthesiaPlanLoading, setAnesthesiaPlanLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  
  // State to track visible time range for charts
  const [visibleTimeRange, setVisibleTimeRange] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  
  // Calculate time range for charts
  const getTimeRange = () => {
    if (vitalSigns.length === 0) {
      return {
        startTime: new Date(Date.now() - 3600000), // Default to 1 hour ago
        endTime: new Date()
      };
    }
    
    // Sort vital signs by timestamp
    const sortedVitalSigns = [...vitalSigns].sort((a, b) => {
      const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
      return dateA.getTime() - dateB.getTime();
    });
    
    return {
      startTime: sortedVitalSigns[0].timestamp instanceof Date 
        ? sortedVitalSigns[0].timestamp 
        : new Date(sortedVitalSigns[0].timestamp),
      endTime: sortedVitalSigns[sortedVitalSigns.length - 1].timestamp instanceof Date
        ? sortedVitalSigns[sortedVitalSigns.length - 1].timestamp
        : new Date(sortedVitalSigns[sortedVitalSigns.length - 1].timestamp)
    };
  };

  const fetchPatientData = async () => {
    if (!patientId) return;

    try {
      setLoading(true);
      setMedicalSummaryLoading(true);
      setAnesthesiaPlanLoading(true);
      
      console.log('Fetching patient data for:', patientId);
      
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
      console.log('Loaded vital signs:', vitalSignsData.length);
      
      // Fetch medications
      const medicationsData = await getMedications(patientId);
      setMedications(medicationsData);
      
      // Fetch patient history
      const historyData = await getPatientHistory(patientId);
      setHistory(historyData);
      
      // Fetch anesthesia medications
      console.log('Fetching anesthesia medications...');
      const bolusesData = await getAnesthesiaBoluses(patientId);
      setAnesthesiaBoluses(bolusesData);
      console.log('Loaded boluses:', bolusesData.length);
      
      const crisData = await getAnesthesiaCRIs(patientId);
      setAnesthesiaCRIs(crisData);
      console.log('Loaded CRIs:', crisData.length);
      
      // Fetch medical summary
      const summaryData = await getMedicalSummary(patientId);
      setMedicalSummary(summaryData);
      setMedicalSummaryLoading(false);
      
      // Fetch anesthesia plan
      const planData = await getAnesthesiaPlan(patientId);
      setAnesthesiaPlan(planData);
      setAnesthesiaPlanLoading(false);
      
      setError('');
      console.log('Patient data loaded successfully');
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

  const handleDataAdded = () => {
    // Refresh the patient data
    if (patientId) {
      fetchPatientData();
    }
  };

  // Handle chart visible range change
  const handleVisibleRangeChange = (range: { start: Date; end: Date }) => {
    setVisibleTimeRange(range);
  };

  if (!patientId) {
    return <Navigate to="/patients" />;
  }

  // Time range for charts
  const timeRange = getTimeRange();

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleBackClick} style={{ marginRight: '8px' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Patient Details
          </Typography>
        </div>
        
        {patient && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {patient.name}
            </Typography>
            <Chip 
              label={patient.status} 
              color={patient.status === 'Active' ? 'success' : 'default'}
              size="small"
            />
            <Chip 
              label={`ID: ${patient.clientId}`} 
              variant="outlined" 
              size="small"
            />
            <Chip 
              label={`Weight: ${patient.weight}`} 
              variant="outlined" 
              size="small"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
          <CircularProgress />
        </div>
      ) : error ? (
        <Typography color="error" style={{ marginTop: '16px' }}>
          {error}
        </Typography>
      ) : patient ? (
        <>
          <Paper style={{ marginBottom: '24px', width: '100%' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              variant="fullWidth"
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label="Vital Signs" />
              <Tab label="Anesthesia Plan" />
              <Tab label="Medical Summary" />
            </Tabs>
            
            <TabPanel value={activeTab} index={0}>
              {/* Anesthesia Medication Chart */}
              {currentUser && (
                <AnesthesiaMedicationChart 
                  key={`anesthesia-chart-${anesthesiaBoluses.length}-${anesthesiaCRIs.length}`}
                  patientId={patientId}
                  vitalSignsStartTime={timeRange.startTime}
                  vitalSignsEndTime={timeRange.endTime}
                  visibleTimeRange={visibleTimeRange || undefined}
                  onMedicationAdded={handleDataAdded}
                  currentUser={currentUser.email || currentUser.uid}
                />
              )}
              
              <div style={{ width: '100%', marginTop: '24px' }}>
                <Card>
                  <div style={{ width: '100%' }}>
                    {vitalSigns.length > 0 ? (
                      <VitalSignsChart 
                        vitalSigns={vitalSigns} 
                        onVisibleRangeChange={handleVisibleRangeChange}
                      />
                    ) : (
                      <Typography style={{ padding: '16px' }}>No vital signs data available</Typography>
                    )}
                  </div>
                </Card>
              </div>
              
              {/* Add Vital Signs Form */}
              <VitalSignForm patientId={patientId} onVitalSignAdded={handleDataAdded} />
            </TabPanel>
            
            <TabPanel value={activeTab} index={1}>
              <div style={{ width: '100%' }}>
                <Card>
                  <CardHeader 
                    title="Anesthesia and Pain Management Plan" 
                    action={
                      <Button 
                        variant="contained" 
                        size="small"
                        onClick={() => navigate(`/patients/${patientId}/anesthesia-plan/edit`)}
                      >
                        Edit Plan
                      </Button>
                    }
                  />
                  <Divider />
                  <div style={{ width: '100%', padding: '16px' }}>
                    <AnesthesiaPlanView 
                      plan={anesthesiaPlan} 
                      loading={anesthesiaPlanLoading} 
                      patientWeight={patient.weight}
                    />
                  </div>
                </Card>
              </div>
            </TabPanel>
            
            <TabPanel value={activeTab} index={2}>
              <div style={{ width: '100%' }}>
                <Card>
                  <CardHeader 
                    title="Medical Summary" 
                    action={
                      <Button 
                        variant="contained" 
                        size="small"
                        onClick={() => navigate(`/patients/${patientId}/medical-summary/edit`)}
                      >
                        Edit Medical Summary
                      </Button>
                    }
                  />
                  <Divider />
                  <div style={{ width: '100%', padding: '16px' }}>
                    <MedicalSummaryView 
                      summary={medicalSummary} 
                      loading={medicalSummaryLoading} 
                    />
                  </div>
                </Card>
              </div>
            </TabPanel>
          </Paper>
        </>
      ) : null}
    </div>
  );
}; 