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
  InputAdornment,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import PetsIcon from '@mui/icons-material/Pets';
import FilterListIcon from '@mui/icons-material/FilterList';
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
  const theme = useTheme();

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

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      searchQuery === '' ||
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.clientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (patient.ownerName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSpecies = selectedSpecies === '' || patient.species === selectedSpecies;
    const matchesStatus = selectedStatus === '' || patient.status === selectedStatus;

    return matchesSearch && matchesSpecies && matchesStatus;
  });

  const speciesList = [...new Set(patients.map((patient) => patient.species))].sort();

  const handleSpeciesChange = (event: SelectChangeEvent) => setSelectedSpecies(event.target.value);
  const handleStatusChange = (event: SelectChangeEvent) => setSelectedStatus(event.target.value);
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(event.target.value);

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>
            Patients
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loading ? 'Loading...' : `${filteredPatients.length} of ${patients.length} patients`}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/patients/new')}
          sx={{ flexShrink: 0 }}
        >
          New Patient
        </Button>
      </Box>

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 0.5 }}>
          <FilterListIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            FILTER
          </Typography>
        </Box>
        <TextField
          placeholder="Search by name, ID, or owner..."
          value={searchQuery}
          onChange={handleSearchChange}
          variant="outlined"
          sx={{ flexGrow: 1, minWidth: 220 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />

        <Select
          value={selectedSpecies}
          onChange={handleSpeciesChange}
          displayEmpty
          sx={{ minWidth: 140 }}
          renderValue={(selected) => (selected === '' ? <em style={{ color: '#9e9e9e' }}>All Species</em> : selected)}
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
          sx={{ minWidth: 130 }}
          renderValue={(selected) => (selected === '' ? <em style={{ color: '#9e9e9e' }}>All Statuses</em> : selected)}
        >
          <MenuItem value="">
            <em>All Statuses</em>
          </MenuItem>
          <MenuItem value="Active">Active</MenuItem>
          <MenuItem value="Inactive">Inactive</MenuItem>
        </Select>
      </Paper>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper
          elevation={0}
          sx={{ p: 4, textAlign: 'center', border: '1px solid', borderColor: 'error.light', borderRadius: 2 }}
        >
          <Typography color="error">{error}</Typography>
        </Paper>
      ) : filteredPatients.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            backgroundColor: 'background.default',
          }}
        >
          <PetsIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.4, mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No patients found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery || selectedSpecies || selectedStatus
              ? 'Try adjusting your search filters'
              : 'Get started by adding your first patient'}
          </Typography>
          {!searchQuery && !selectedSpecies && !selectedStatus && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/patients/new')}>
              Add First Patient
            </Button>
          )}
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Client ID</TableCell>
                <TableCell>Species / Breed</TableCell>
                <TableCell>Age</TableCell>
                <TableCell>Weight</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPatients.map((patient, index) => (
                <TableRow
                  key={patient.id}
                  hover
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: index % 2 === 0 ? '#fff' : alpha(theme.palette.primary.main, 0.02),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <PetsIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {patient.name}
                        </Typography>
                        {patient.ownerName && (
                          <Typography variant="caption" color="text.secondary">
                            {patient.ownerName}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                      {patient.clientId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{patient.species}</Typography>
                    {patient.breed && (
                      <Typography variant="caption" color="text.secondary">
                        {patient.breed}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{patient.age || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {patient.weight ? `${patient.weight} kg` : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={patient.status}
                      size="small"
                      color={patient.status === 'Active' ? 'success' : 'default'}
                      variant={patient.status === 'Active' ? 'filled' : 'outlined'}
                      sx={{ minWidth: 70 }}
                    />
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      <Tooltip title="View Patient Record">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/patients/${patient.id}`);
                          }}
                          sx={{
                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                            '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.16) },
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Patient">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/patients/${patient.id}/edit`);
                          }}
                          sx={{
                            backgroundColor: alpha(theme.palette.secondary.main, 0.08),
                            '&:hover': { backgroundColor: alpha(theme.palette.secondary.main, 0.16) },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
