import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button,
  Typography, 
  TextField, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  CircularProgress,
  Select,
  MenuItem,
  SelectChangeEvent,
  Chip,
  IconButton,
  InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DescriptionIcon from '@mui/icons-material/Description';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { getPatients } from '../services/patients';
import { Patient } from '../types';

export const PatientsList: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const data = await getPatients();
        setPatients(data);
        setError('');
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError('Failed to load patients. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Filter patients based on search and filters
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = searchQuery === '' || 
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      patient.clientId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecies = selectedSpecies === '' || patient.species === selectedSpecies;
    const matchesStatus = selectedStatus === '' || patient.status === selectedStatus;
    
    return matchesSearch && matchesSpecies && matchesStatus;
  });

  // Extract unique species for the dropdown
  const speciesList = [...new Set(patients.map(patient => patient.species))];

  const handleSpeciesChange = (event: SelectChangeEvent) => {
    setSelectedSpecies(event.target.value);
  };

  const handleStatusChange = (event: SelectChangeEvent) => {
    setSelectedStatus(event.target.value);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleAddPatient = () => {
    navigate('/patients/new');
  };

  const handleViewPatient = (patientId: string) => {
    navigate(`/patients/${patientId}`);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Patients
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleAddPatient}
        >
          Add Patient
        </Button>
      </Box>
      
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search"
          value={searchQuery}
          onChange={handleSearchChange}
          variant="outlined"
          sx={{ flexGrow: 1, minWidth: '200px' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <Select
          value={selectedSpecies}
          onChange={handleSpeciesChange}
          displayEmpty
          sx={{ minWidth: '150px' }}
          renderValue={(selected) => {
            if (selected === '') {
              return <em>Species</em>;
            }
            return selected;
          }}
        >
          <MenuItem value="">
            <em>All Species</em>
          </MenuItem>
          {speciesList.map((species) => (
            <MenuItem key={species} value={species}>
              {species}
            </MenuItem>
          ))}
        </Select>
        
        <Select
          value={selectedStatus}
          onChange={handleStatusChange}
          displayEmpty
          sx={{ minWidth: '120px' }}
          renderValue={(selected) => {
            if (selected === '') {
              return <em>Status</em>;
            }
            return selected;
          }}
        >
          <MenuItem value="">
            <em>All Statuses</em>
          </MenuItem>
          <MenuItem value="Active">Active</MenuItem>
          <MenuItem value="Inactive">Inactive</MenuItem>
        </Select>
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
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Client ID</TableCell>
                <TableCell>Species</TableCell>
                <TableCell>Breed</TableCell>
                <TableCell>Age</TableCell>
                <TableCell>Weight</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow key={patient.id} hover>
                  <TableCell>{patient.name}</TableCell>
                  <TableCell>{patient.clientId}</TableCell>
                  <TableCell>{patient.species}</TableCell>
                  <TableCell>{patient.breed}</TableCell>
                  <TableCell>{patient.age}</TableCell>
                  <TableCell>{patient.weight}</TableCell>
                  <TableCell>
                    <Chip 
                      label={patient.status} 
                      color={patient.status === 'Active' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex' }}>
                      <IconButton 
                        color="primary" 
                        onClick={() => handleViewPatient(patient.id)}
                        title="View Patient"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton 
                        color="secondary"
                        onClick={() => navigate(`/patients/${patient.id}/edit`)}
                        title="Edit Patient"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        color="info"
                        onClick={() => handleViewPatient(patient.id)}
                        title="Patient Records"
                      >
                        <DescriptionIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPatients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No patients found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}; 