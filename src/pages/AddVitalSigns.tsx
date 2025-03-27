import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  IconButton,
  Stack,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { addVitalSign } from '../services/patients';
import { VitalSign } from '../types';

interface AddVitalSignsProps {
  inline?: boolean;
  onVitalSignsAdded?: () => void;
  patientId?: string;
}

export const AddVitalSigns: React.FC<AddVitalSignsProps> = ({ 
  inline = false, 
  onVitalSignsAdded,
  patientId: propPatientId
}) => {
  const params = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  
  // Use the provided patientId prop in inline mode, or get it from URL params
  const patientId = propPatientId || params.patientId;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Form states
  const [heartRate, setHeartRate] = useState<string>('');
  const [respiratoryRate, setRespiratoryRate] = useState<string>('');
  const [spo2, setSpo2] = useState<string>('');
  const [temperature, setTemperature] = useState<string>('');
  const [systolicBP, setSystolicBP] = useState<string>('');
  const [diastolicBP, setDiastolicBP] = useState<string>('');
  const [meanBP, setMeanBP] = useState<string>('');
  const [etCO2, setEtCO2] = useState<string>('');
  const [etIsoflurane, setEtIsoflurane] = useState<string>('');
  const [oxygenFlow, setOxygenFlow] = useState<string>('');
  const [comment, setComment] = useState<string>('');

  // Toggle states
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [persistentValues, setPersistentValues] = useState(true);

  // Reference to keep track of auto-update interval
  const autoUpdateIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Set up auto-update interval when autoUpdate changes
  useEffect(() => {
    // Clear any existing interval
    if (autoUpdateIntervalRef.current) {
      clearInterval(autoUpdateIntervalRef.current);
      autoUpdateIntervalRef.current = null;
    }

    // If auto-update is enabled, set up a new interval
    if (autoUpdate) {
      autoUpdateIntervalRef.current = setInterval(() => {
        handleRandomValues();
      }, 15000); // Update every 15 seconds
    }

    // Clean up the interval when the component unmounts or autoUpdate changes
    return () => {
      if (autoUpdateIntervalRef.current) {
        clearInterval(autoUpdateIntervalRef.current);
      }
    };
  }, [autoUpdate]);

  // Load values from localStorage if enabled
  useEffect(() => {
    if (persistentValues) {
      const savedHeartRate = localStorage.getItem('heartRate');
      const savedRespiratoryRate = localStorage.getItem('respiratoryRate');
      const savedSpo2 = localStorage.getItem('spo2');
      const savedTemperature = localStorage.getItem('temperature');
      const savedSystolicBP = localStorage.getItem('systolicBP');
      const savedDiastolicBP = localStorage.getItem('diastolicBP');
      const savedMeanBP = localStorage.getItem('meanBP');
      const savedEtCO2 = localStorage.getItem('etCO2');
      const savedEtIsoflurane = localStorage.getItem('etIsoflurane');
      const savedOxygenFlow = localStorage.getItem('oxygenFlow');

      if (savedHeartRate) setHeartRate(savedHeartRate);
      if (savedRespiratoryRate) setRespiratoryRate(savedRespiratoryRate);
      if (savedSpo2) setSpo2(savedSpo2);
      if (savedTemperature) setTemperature(savedTemperature);
      if (savedSystolicBP) setSystolicBP(savedSystolicBP);
      if (savedDiastolicBP) setDiastolicBP(savedDiastolicBP);
      if (savedMeanBP) setMeanBP(savedMeanBP);
      if (savedEtCO2) setEtCO2(savedEtCO2);
      if (savedEtIsoflurane) setEtIsoflurane(savedEtIsoflurane);
      if (savedOxygenFlow) setOxygenFlow(savedOxygenFlow);
    }
  }, [persistentValues]);

  // Save values to localStorage if enabled
  useEffect(() => {
    if (persistentValues) {
      localStorage.setItem('heartRate', heartRate);
      localStorage.setItem('respiratoryRate', respiratoryRate);
      localStorage.setItem('spo2', spo2);
      localStorage.setItem('temperature', temperature);
      localStorage.setItem('systolicBP', systolicBP);
      localStorage.setItem('diastolicBP', diastolicBP);
      localStorage.setItem('meanBP', meanBP);
      localStorage.setItem('etCO2', etCO2);
      localStorage.setItem('etIsoflurane', etIsoflurane);
      localStorage.setItem('oxygenFlow', oxygenFlow);
    }
  }, [
    persistentValues,
    heartRate,
    respiratoryRate,
    spo2,
    temperature,
    systolicBP,
    diastolicBP,
    meanBP,
    etCO2,
    etIsoflurane,
    oxygenFlow
  ]);

  const handleBackClick = () => {
    navigate(`/patients/${patientId}`);
  };

  // Toggle Auto Update
  const toggleAutoUpdate = () => {
    setAutoUpdate(!autoUpdate);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;

    try {
      setLoading(true);
      setError('');

      // Convert form values to numbers (or null if empty)
      const vitalSignData: Omit<VitalSign, 'id'> = {
        timestamp: new Date(),
        heartRate: heartRate ? parseFloat(heartRate) : null,
        respiratoryRate: respiratoryRate ? parseFloat(respiratoryRate) : null,
        temperature: temperature ? parseFloat(temperature) : null,
        bloodPressure: {
          systolic: systolicBP ? parseFloat(systolicBP) : null,
          diastolic: diastolicBP ? parseFloat(diastolicBP) : null
        },
        oxygenSaturation: spo2 ? parseFloat(spo2) : null,
        notes: comment || ''
      };

      // Add the vital sign record
      await addVitalSign(patientId, vitalSignData);
      
      setSuccess(true);
      
      // Clear form if not using persistent values
      if (!persistentValues) {
        clearForm();
      }
      
      // Call the callback if provided (for inline mode)
      if (onVitalSignsAdded) {
        onVitalSignsAdded();
      } else {
        // Return to patient detail page after a short delay (for standalone mode)
        setTimeout(() => {
          navigate(`/patients/${patientId}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Error adding vital signs:', err);
      setError('Failed to save vital signs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRandomValues = () => {
    // Generate random values within typical ranges
    setHeartRate((70 + Math.floor(Math.random() * 40)).toString());
    setRespiratoryRate((12 + Math.floor(Math.random() * 10)).toString());
    setSpo2((95 + Math.floor(Math.random() * 5)).toString());
    setTemperature((37 + Math.random() * 1.5).toFixed(1));
    setSystolicBP((110 + Math.floor(Math.random() * 30)).toString());
    setDiastolicBP((70 + Math.floor(Math.random() * 15)).toString());
    setMeanBP((85 + Math.floor(Math.random() * 15)).toString());
    setEtCO2((35 + Math.floor(Math.random() * 10)).toString());
    setEtIsoflurane((1.5 + Math.random()).toFixed(1));
    setOxygenFlow((1 + Math.floor(Math.random() * 3)).toString());
  };

  const clearForm = () => {
    setHeartRate('');
    setRespiratoryRate('');
    setSpo2('');
    setTemperature('');
    setSystolicBP('');
    setDiastolicBP('');
    setMeanBP('');
    setEtCO2('');
    setEtIsoflurane('');
    setOxygenFlow('');
    setComment('');
  };

  const formContent = (
    <>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <FormControlLabel
          control={
            <Switch
              checked={autoUpdate}
              onChange={toggleAutoUpdate}
              color="primary"
            />
          }
          label={`AUTO-UPDATE: ${autoUpdate ? 'ON' : 'OFF'}`}
          sx={{ 
            border: '1px solid #e0e0e0', 
            borderRadius: 1, 
            px: 2,
            color: autoUpdate ? 'success.main' : 'text.primary',
            bgcolor: autoUpdate ? 'success.light' : 'background.paper',
          }}
        />
        
        <Button 
          variant="outlined" 
          color="primary"
          onClick={handleRandomValues}
        >
          RECORD RANDOM VALUES
        </Button>
        
        <FormControlLabel
          control={
            <Switch
              checked={persistentValues}
              onChange={() => setPersistentValues(!persistentValues)}
              color="primary"
            />
          }
          label={`PERSISTENT VALUES: ${persistentValues ? 'ON' : 'OFF'}`}
          sx={{ 
            border: '1px solid #e0e0e0', 
            borderRadius: 1, 
            px: 2,
            bgcolor: persistentValues ? 'success.light' : 'background.paper',
            color: persistentValues ? 'white' : 'text.primary'
          }}
        />
        
        <Button 
          variant="outlined" 
          color="error"
          onClick={clearForm}
        >
          CLEAR FORM
        </Button>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: '1 1 30%', minWidth: '250px' }}>
          <TextField
            label="Heart Rate (bpm)"
            fullWidth
            value={heartRate}
            onChange={(e) => setHeartRate(e.target.value)}
            type="number"
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
          />
        </Box>
        
        <Box sx={{ flex: '1 1 30%', minWidth: '250px' }}>
          <TextField
            label="Respiratory Rate (bpm)"
            fullWidth
            value={respiratoryRate}
            onChange={(e) => setRespiratoryRate(e.target.value)}
            type="number"
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
          />
        </Box>
        
        <Box sx={{ flex: '1 1 30%', minWidth: '250px' }}>
          <TextField
            label="SpO2 (%)"
            fullWidth
            value={spo2}
            onChange={(e) => setSpo2(e.target.value)}
            type="number"
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', min: 0, max: 100 }}
          />
        </Box>
        
        <Box sx={{ flex: '1 1 30%', minWidth: '250px' }}>
          <TextField
            label="Temperature (°F)"
            fullWidth
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            type="number"
            inputProps={{ inputMode: 'decimal', step: "0.1" }}
          />
        </Box>
        
        <Box sx={{ flex: '1 1 30%', minWidth: '250px' }}>
          <TextField
            label="Systolic BP (mmHg)"
            fullWidth
            value={systolicBP}
            onChange={(e) => setSystolicBP(e.target.value)}
            type="number"
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
          />
        </Box>
        
        <Box sx={{ flex: '1 1 30%', minWidth: '250px' }}>
          <TextField
            label="Diastolic BP (mmHg)"
            fullWidth
            value={diastolicBP}
            onChange={(e) => setDiastolicBP(e.target.value)}
            type="number"
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
          />
        </Box>
        
        <Box sx={{ flex: '1 1 30%', minWidth: '250px' }}>
          <TextField
            label="Mean BP (mmHg)"
            fullWidth
            value={meanBP}
            onChange={(e) => setMeanBP(e.target.value)}
            type="number"
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
          />
        </Box>
        
        <Box sx={{ flex: '1 1 30%', minWidth: '250px' }}>
          <TextField
            label="etCO2 (mmHg)"
            fullWidth
            value={etCO2}
            onChange={(e) => setEtCO2(e.target.value)}
            type="number"
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
          />
        </Box>
        
        <Box sx={{ flex: '1 1 30%', minWidth: '250px' }}>
          <TextField
            label="etIsoflurane (%)"
            fullWidth
            value={etIsoflurane}
            onChange={(e) => setEtIsoflurane(e.target.value)}
            type="number"
            inputProps={{ inputMode: 'decimal', step: "0.1" }}
          />
        </Box>
        
        <Box sx={{ flex: '1 1 30%', minWidth: '250px' }}>
          <TextField
            label="Oxygen Flow (L/min)"
            fullWidth
            value={oxygenFlow}
            onChange={(e) => setOxygenFlow(e.target.value)}
            type="number"
            inputProps={{ inputMode: 'decimal', step: "0.1" }}
          />
        </Box>
        
        <Box sx={{ width: '100%' }}>
          <TextField
            label="Comment"
            fullWidth
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            multiline
            rows={4}
          />
        </Box>
      </Box>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={loading}
          sx={{ minWidth: 200, py: 1.5 }}
        >
          SAVE VITAL SIGNS
        </Button>
      </Box>
    </>
  );

  // If inline mode, return just the form content without the header and wrapper
  if (inline) {
    return (
      <Box component="form" onSubmit={handleSubmit}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Vital signs recorded successfully!
          </Alert>
        )}

        {formContent}
      </Box>
    );
  }

  // Standalone mode with full page layout
  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={handleBackClick} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Record Vital Signs
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Vital signs recorded successfully!
        </Alert>
      )}

      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3, mb: 3 }}>
        {formContent}
      </Paper>
    </Box>
  );
}; 