import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Grid as MuiGrid,
  Typography,
  Paper,
  Collapse,
  IconButton,
  Divider,
  InputAdornment,
  Alert,
  Stack,
  Slider,
  Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { VitalSign } from '../types';
import { addVitalSign } from '../services/patients';

interface VitalSignFormProps {
  patientId: string;
  onVitalSignAdded: () => void;
}

export const VitalSignForm: React.FC<VitalSignFormProps> = ({ patientId, onVitalSignAdded }) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form values
  const [temperature, setTemperature] = useState<string>('');
  const [heartRate, setHeartRate] = useState<string>('');
  const [respiratoryRate, setRespiratoryRate] = useState<string>('');
  const [systolic, setSystolic] = useState<string>('');
  const [diastolic, setDiastolic] = useState<string>('');
  const [meanPressure, setMeanPressure] = useState<string>('');
  const [oxygenSaturation, setOxygenSaturation] = useState<string>('');
  const [etCO2, setEtCO2] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Calculate MAP automatically when systolic or diastolic changes
  useEffect(() => {
    if (systolic && diastolic) {
      // MAP ≈ DBP + 1/3(SBP - DBP)
      const sbp = parseFloat(systolic);
      const dbp = parseFloat(diastolic);
      if (!isNaN(sbp) && !isNaN(dbp)) {
        const map = Math.round(dbp + (1/3) * (sbp - dbp));
        setMeanPressure(map.toString());
      }
    }
  }, [systolic, diastolic]);

  const toggleExpanded = () => {
    setExpanded(!expanded);
    // Reset success message when reopening the form
    if (!expanded) {
      setSuccess(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      // Validate inputs
      if (!temperature || !heartRate || !respiratoryRate || !systolic || !diastolic) {
        setError('Please fill all required fields');
        return;
      }

      // Create vital sign object
      const newVitalSign: Omit<VitalSign, 'id'> = {
        timestamp: new Date(),
        temperature: parseFloat(temperature),
        heartRate: parseInt(heartRate),
        respiratoryRate: parseInt(respiratoryRate),
        bloodPressure: {
          systolic: parseInt(systolic),
          diastolic: parseInt(diastolic),
          mean: meanPressure ? parseInt(meanPressure) : null
        },
        oxygenSaturation: oxygenSaturation ? parseInt(oxygenSaturation) : null,
        etCO2: etCO2 ? parseInt(etCO2) : null,
        painScore: null,
        notes
      };

      // Add vital sign
      await addVitalSign(patientId, newVitalSign);
      
      // Clear form
      setTemperature('');
      setHeartRate('');
      setRespiratoryRate('');
      setSystolic('');
      setDiastolic('');
      setMeanPressure('');
      setOxygenSaturation('');
      setEtCO2('');
      setNotes('');
      
      // Show success message
      setSuccess(true);
      
      // Call callback to refresh vital signs
      onVitalSignAdded();
      
    } catch (err) {
      console.error('Error adding vital sign:', err);
      setError('Failed to add vital sign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const anestheticDepthMarks = [
    { value: 1, label: 'Light' },
    { value: 2, label: '' },
    { value: 3, label: 'Moderate' },
    { value: 4, label: '' },
    { value: 5, label: 'Deep' },
  ];

  return (
    <Paper sx={{ mb: 3 }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {expanded ? 'Add New Vital Sign Reading' : 'Add Vital Signs'}
        </Typography>
        <IconButton onClick={toggleExpanded}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      
      <Collapse in={expanded}>
        <Divider />
        
        <Box sx={{ p: 3 }}>
          {success && (
            <Alert 
              icon={<CheckCircleIcon fontSize="inherit" />} 
              severity="success"
              sx={{ mb: 2 }}
            >
              Vital sign recorded successfully!
            </Alert>
          )}
          
          {error && (
            <Alert 
              severity="error"
              sx={{ mb: 2 }}
            >
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  required
                  label="Temperature"
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">°C</InputAdornment>,
                  }}
                  inputProps={{
                    step: 0.1,
                    min: 35,
                    max: 43
                  }}
                  sx={{ flex: '1 1 200px' }}
                />
                <TextField
                  required
                  label="Heart Rate"
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">bpm</InputAdornment>,
                  }}
                  inputProps={{
                    step: 1,
                    min: 20,
                    max: 300
                  }}
                  sx={{ flex: '1 1 200px' }}
                />
                <TextField
                  required
                  label="Respiratory Rate"
                  type="number"
                  value={respiratoryRate}
                  onChange={(e) => setRespiratoryRate(e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">bpm</InputAdornment>,
                  }}
                  inputProps={{
                    step: 1,
                    min: 5,
                    max: 100
                  }}
                  sx={{ flex: '1 1 200px' }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  required
                  label="Systolic BP"
                  type="number"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">mmHg</InputAdornment>,
                  }}
                  inputProps={{
                    step: 1,
                    min: 60,
                    max: 300
                  }}
                  sx={{ flex: '1 1 150px' }}
                />
                <TextField
                  required
                  label="Diastolic BP"
                  type="number"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">mmHg</InputAdornment>,
                  }}
                  inputProps={{
                    step: 1,
                    min: 30,
                    max: 200
                  }}
                  sx={{ flex: '1 1 150px' }}
                />
                <Tooltip title="Mean Arterial Pressure (auto-calculated)">
                  <TextField
                    label="Mean BP"
                    type="number"
                    value={meanPressure}
                    onChange={(e) => setMeanPressure(e.target.value)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">mmHg</InputAdornment>,
                    }}
                    inputProps={{
                      step: 1,
                      min: 40,
                      max: 200
                    }}
                    sx={{ flex: '1 1 150px' }}
                  />
                </Tooltip>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  label="SpO2"
                  type="number"
                  value={oxygenSaturation}
                  onChange={(e) => setOxygenSaturation(e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  inputProps={{
                    step: 1,
                    min: 70,
                    max: 100
                  }}
                  sx={{ flex: '1 1 200px' }}
                />
                <TextField
                  label="ETCO2"
                  type="number"
                  value={etCO2}
                  onChange={(e) => setEtCO2(e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">mmHg</InputAdornment>,
                  }}
                  inputProps={{
                    step: 1,
                    min: 20,
                    max: 80
                  }}
                  sx={{ flex: '1 1 200px' }}
                />
              </Box>
              
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes about patient condition, treatments, observations"
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  size="large"
                >
                  {loading ? 'Saving...' : 'Save Vital Signs'}
                </Button>
              </Box>
            </Stack>
          </form>
        </Box>
      </Collapse>
    </Paper>
  );
}; 