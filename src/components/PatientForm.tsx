import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Paper, 
  Typography, 
  Stack,
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Alert,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import { addPatient, updatePatient } from '../services/patients';
import { Patient } from '../types';

interface PatientFormProps {
  onPatientAdded: () => void;
  initialPatient?: Patient;
  isEditing?: boolean;
}

type PatientStatus = 'Active' | 'Inactive';

const PatientForm: React.FC<PatientFormProps> = ({ 
  onPatientAdded, 
  initialPatient, 
  isEditing = false 
}) => {
  const [formValues, setFormValues] = useState({
    name: '',
    species: 'Canine',
    breed: '',
    age: '',
    weight: '',
    clientId: '',
    status: 'Active' as PatientStatus
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize form with patient data if editing
  useEffect(() => {
    if (initialPatient && isEditing) {
      setFormValues({
        name: initialPatient.name,
        species: initialPatient.species,
        breed: initialPatient.breed || '',
        age: initialPatient.age || '',
        weight: initialPatient.weight || '',
        clientId: initialPatient.clientId || '',
        status: initialPatient.status as PatientStatus || 'Active'
      });
    }
  }, [initialPatient, isEditing]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: value
    });
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate required fields
      if (!formValues.name || !formValues.species) {
        throw new Error('Name and species are required');
      }

      const patientData: Omit<Patient, 'id'> = {
        name: formValues.name,
        species: formValues.species,
        breed: formValues.breed,
        age: formValues.age,
        weight: formValues.weight,
        clientId: formValues.clientId,
        status: formValues.status
      };

      if (isEditing && initialPatient) {
        await updatePatient(initialPatient.id, patientData);
      } else {
        await addPatient(patientData);
        
        // Reset form only if adding a new patient
        if (!isEditing) {
          setFormValues({
            name: '',
            species: 'Canine',
            breed: '',
            age: '',
            weight: '',
            clientId: '',
            status: 'Active' as PatientStatus
          });
        }
      }
      
      setSuccess(true);
      onPatientAdded();
    } catch (err) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} patient:`, err);
      setError(`Failed to ${isEditing ? 'update' : 'add'} patient: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        {isEditing ? 'Edit Patient' : 'Add New Patient'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Patient {isEditing ? 'updated' : 'added'} successfully!
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <TextField
              required
              fullWidth
              label="Patient Name"
              name="name"
              value={formValues.name}
              onChange={handleTextChange}
              variant="outlined"
              margin="normal"
              autoComplete="off"
              sx={{ flex: '1 1 45%' }}
            />
            
            <TextField
              fullWidth
              label="Client ID"
              name="clientId"
              value={formValues.clientId}
              onChange={handleTextChange}
              variant="outlined"
              margin="normal"
              autoComplete="off"
              placeholder="e.g., C1001"
              sx={{ flex: '1 1 45%' }}
            />
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <FormControl fullWidth margin="normal" sx={{ flex: '1 1 45%' }}>
              <InputLabel id="species-label">Species</InputLabel>
              <Select
                labelId="species-label"
                name="species"
                value={formValues.species}
                onChange={handleSelectChange}
                label="Species"
              >
                <MenuItem value="Canine">Canine</MenuItem>
                <MenuItem value="Feline">Feline</MenuItem>
                <MenuItem value="Equine">Equine</MenuItem>
                <MenuItem value="Avian">Avian</MenuItem>
                <MenuItem value="Exotic">Exotic</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Breed"
              name="breed"
              value={formValues.breed}
              onChange={handleTextChange}
              variant="outlined"
              margin="normal"
              autoComplete="off"
              sx={{ flex: '1 1 45%' }}
            />
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <TextField
              fullWidth
              label="Age"
              name="age"
              value={formValues.age}
              onChange={handleTextChange}
              variant="outlined"
              margin="normal"
              autoComplete="off"
              placeholder="e.g., 5 years"
              sx={{ flex: '1 1 45%' }}
            />

            <TextField
              fullWidth
              label="Weight"
              name="weight"
              value={formValues.weight}
              onChange={handleTextChange}
              variant="outlined"
              margin="normal"
              autoComplete="off"
              placeholder="e.g., 25.5 kg"
              sx={{ flex: '1 1 45%' }}
            />
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <FormControl fullWidth margin="normal" sx={{ flex: '1 1 45%' }}>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                name="status"
                value={formValues.status}
                onChange={handleSelectChange}
                label="Status"
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Stack>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                {isEditing ? 'Updating...' : 'Saving...'}
              </>
            ) : isEditing ? 'Update Patient' : 'Add Patient'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default PatientForm; 