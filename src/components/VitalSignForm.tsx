import React, { useState } from 'react';
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
  Stack
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
  const [oxygenSaturation, setOxygenSaturation] = useState<string>('');
  const [notes, setNotes] = useState('');

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
      if (!temperature || !heartRate || !respiratoryRate || !systolic || !diastolic || !oxygenSaturation) {
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
        },
        oxygenSaturation: parseInt(oxygenSaturation),
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
      setOxygenSaturation('');
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
            <Stack spacing={2}>
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
                  label="Systolic Blood Pressure"
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
                  sx={{ flex: '1 1 200px' }}
                />
                <TextField
                  required
                  label="Diastolic Blood Pressure"
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
                  sx={{ flex: '1 1 200px' }}
                />
                <TextField
                  required
                  label="Oxygen Saturation"
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
              </Box>
              
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes about the patient's condition"
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
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