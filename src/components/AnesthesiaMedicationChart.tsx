import React, { useEffect, useState, useRef } from 'react';
import { 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Paper, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import StopIcon from '@mui/icons-material/Stop';
import { AnesthesiaCRI, AnesthesiaBolus } from '../types';
import { addAnesthesiaBolus, addAnesthesiaCRI, updateCRIRate, stopCRI, getAnesthesiaCRIs, getAnesthesiaBoluses } from '../services/patients';

// Define available medications
const availableCRIs = [
  { name: 'Ketamine', defaultUnit: 'mcg/kg/min', color: '#64b5f6' },
  { name: 'Lidocaine', defaultUnit: 'mcg/kg/min', color: '#4db6ac' },
  { name: 'Fentanyl', defaultUnit: 'mcg/kg/hr', color: '#9575cd' },
  { name: 'Propofol', defaultUnit: 'mg/kg/hr', color: '#4fc3f7' },
  { name: 'Midazolam', defaultUnit: 'mg/kg/hr', color: '#81c784' },
  { name: 'Dexmedetomidine', defaultUnit: 'mcg/kg/hr', color: '#ff8a65' },
  { name: 'Lactated Ringers', defaultUnit: 'mL/kg/hr', color: '#e0e0e0' },
];

const availableBoluses = [
  { name: 'Propofol', defaultUnit: 'mg/kg', color: '#4fc3f7' },
  { name: 'Ketamine', defaultUnit: 'mg/kg', color: '#64b5f6' },
  { name: 'Hydromorphone', defaultUnit: 'mg/kg', color: '#ffb74d' },
  { name: 'Midazolam', defaultUnit: 'mg/kg', color: '#81c784' },
  { name: 'Atropine', defaultUnit: 'mg/kg', color: '#f48fb1' },
  { name: 'Glycopyrrolate', defaultUnit: 'mg/kg', color: '#ce93d8' },
];

interface AnesthesiaMedicationChartProps {
  patientId: string;
  vitalSignsStartTime?: Date;
  vitalSignsEndTime?: Date;
  visibleTimeRange?: {
    start: Date;
    end: Date;
  };
  onMedicationAdded?: () => void;
  currentUser: string;
}

const AnesthesiaMedicationChart: React.FC<AnesthesiaMedicationChartProps> = ({
  patientId,
  vitalSignsStartTime,
  vitalSignsEndTime,
  visibleTimeRange,
  onMedicationAdded,
  currentUser
}) => {
  // State for CRIs and boluses
  const [activeCRIs, setActiveCRIs] = useState<AnesthesiaCRI[]>([]);
  const [boluses, setBoluses] = useState<AnesthesiaBolus[]>([]);

  // Dialog states
  const [addCRIOpen, setAddCRIOpen] = useState(false);
  const [addBolusOpen, setAddBolusOpen] = useState(false);
  const [editRateOpen, setEditRateOpen] = useState(false);
  
  // Form state
  const [selectedCRI, setSelectedCRI] = useState('');
  const [selectedBolus, setSelectedBolus] = useState('');
  const [criRate, setCRIRate] = useState('');
  const [bolusAmount, setBolusAmount] = useState('');
  const [criUnit, setCRIUnit] = useState('');
  const [bolusUnit, setBolusUnit] = useState('');
  const [editCRIId, setEditCRIId] = useState('');
  const [newRate, setNewRate] = useState('');
  
  // Success/error messages
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  
  // Get effective time range for charts
  const effectiveStartTime = vitalSignsStartTime || new Date(Date.now() - 3600000); // Default to 1 hour ago
  const effectiveEndTime = vitalSignsEndTime || new Date();
  
  // Fetch medication data from the database
  useEffect(() => {
    const fetchMedicationData = async () => {
      try {
        // Fetch CRIs and boluses
        const fetchedCRIs = await getAnesthesiaCRIs(patientId);
        const fetchedBoluses = await getAnesthesiaBoluses(patientId);
        
        // Set state with fetched data
        setActiveCRIs(fetchedCRIs);
        setBoluses(fetchedBoluses);
      } catch (error) {
        console.error('Error fetching medication data:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load anesthesia medications',
          severity: 'error'
        });
      }
    };
    
    fetchMedicationData();
  }, [patientId]);
  
  // Calculate positions based on timestamp relative to the chart range
  const calculateTimePosition = (timestamp: Date): number => {
    const totalDuration = effectiveEndTime.getTime() - effectiveStartTime.getTime();
    const position = timestamp.getTime() - effectiveStartTime.getTime();
    return (position / totalDuration) * 100;
  };
  
  // Calculate width for CRIs based on start and end times
  const calculateCRIWidth = (startTime: Date, endTime?: Date): number => {
    const end = endTime || new Date();
    const totalDuration = effectiveEndTime.getTime() - effectiveStartTime.getTime();
    const duration = end.getTime() - startTime.getTime();
    return (duration / totalDuration) * 100;
  };
  
  // Filter CRIs and boluses based on visible range
  const getVisibleMedications = () => {
    if (!visibleTimeRange) {
      return { visibleCRIs: activeCRIs, visibleBoluses: boluses };
    }
    
    const { start, end } = visibleTimeRange;
    
    const visibleCRIs = activeCRIs.filter(cri => {
      const criEnd = cri.endTime || new Date();
      return (cri.startTime <= end && criEnd >= start);
    });
    
    const visibleBoluses = boluses.filter(bolus => 
      bolus.timestamp >= start && bolus.timestamp <= end
    );
    
    return { visibleCRIs, visibleBoluses };
  };
  
  // Handle adding a new CRI
  const handleAddCRI = async () => {
    if (!selectedCRI || !criRate) {
      setSnackbar({
        open: true,
        message: 'Please select a medication and enter a rate',
        severity: 'error'
      });
      return;
    }
    
    try {
      const medication = availableCRIs.find(m => m.name === selectedCRI);
      if (!medication) return;
      
      const newCRI: Omit<AnesthesiaCRI, 'id'> = {
        name: selectedCRI,
        rate: parseFloat(criRate),
        unit: criUnit || medication.defaultUnit,
        startTime: new Date(),
        administeredBy: currentUser
      };
      
      await addAnesthesiaCRI(patientId, newCRI);
      
      setSnackbar({
        open: true,
        message: `${selectedCRI} CRI started at ${criRate} ${criUnit || medication.defaultUnit}`,
        severity: 'success'
      });
      
      // Reset form
      setSelectedCRI('');
      setCRIRate('');
      setCRIUnit('');
      setAddCRIOpen(false);
      
      // Refresh data
      if (onMedicationAdded) {
        onMedicationAdded();
      }
    } catch (error) {
      console.error('Error adding CRI:', error);
      setSnackbar({
        open: true,
        message: 'Failed to add CRI. Please try again.',
        severity: 'error'
      });
    }
  };
  
  // Handle adding a new bolus
  const handleAddBolus = async () => {
    if (!selectedBolus || !bolusAmount) {
      setSnackbar({
        open: true,
        message: 'Please select a medication and enter an amount',
        severity: 'error'
      });
      return;
    }
    
    try {
      const medication = availableBoluses.find(m => m.name === selectedBolus);
      if (!medication) return;
      
      const newBolus: Omit<AnesthesiaBolus, 'id'> = {
        name: selectedBolus,
        dose: parseFloat(bolusAmount),
        unit: bolusUnit || medication.defaultUnit,
        timestamp: new Date(),
        administeredBy: currentUser
      };
      
      await addAnesthesiaBolus(patientId, newBolus);
      
      setSnackbar({
        open: true,
        message: `${selectedBolus} bolus of ${bolusAmount} ${bolusUnit || medication.defaultUnit} administered`,
        severity: 'success'
      });
      
      // Reset form
      setSelectedBolus('');
      setBolusAmount('');
      setBolusUnit('');
      setAddBolusOpen(false);
      
      // Refresh data
      if (onMedicationAdded) {
        onMedicationAdded();
      }
    } catch (error) {
      console.error('Error adding bolus:', error);
      setSnackbar({
        open: true,
        message: 'Failed to add bolus. Please try again.',
        severity: 'error'
      });
    }
  };
  
  // Open edit rate dialog
  const handleOpenEditRate = (criId: string, currentRate: number) => {
    setEditCRIId(criId);
    setNewRate(currentRate.toString());
    setEditRateOpen(true);
  };
  
  // Submit rate change
  const handleUpdateRate = async () => {
    if (!editCRIId || !newRate) return;
    
    try {
      const rateValue = parseFloat(newRate);
      await updateCRIRate(patientId, editCRIId, rateValue);
      
      setSnackbar({
        open: true,
        message: `CRI rate updated to ${newRate}`,
        severity: 'success'
      });
      
      setEditRateOpen(false);
      
      // Refresh data
      if (onMedicationAdded) {
        onMedicationAdded();
      }
    } catch (error) {
      console.error('Error updating CRI rate:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update rate. Please try again.',
        severity: 'error'
      });
    }
  };
  
  // Stop a CRI
  const handleStopCRI = async (criId: string) => {
    try {
      await stopCRI(patientId, criId);
      
      setSnackbar({
        open: true,
        message: 'CRI stopped successfully',
        severity: 'success'
      });
      
      // Refresh data
      if (onMedicationAdded) {
        onMedicationAdded();
      }
    } catch (error) {
      console.error('Error stopping CRI:', error);
      setSnackbar({
        open: true,
        message: 'Failed to stop CRI. Please try again.',
        severity: 'error'
      });
    }
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Generate time markers for the timeline
  const generateTimeMarkers = () => {
    const markers = [];
    const totalDuration = effectiveEndTime.getTime() - effectiveStartTime.getTime();
    
    // Add 5 markers evenly spaced
    for (let i = 0; i < 5; i++) {
      const time = new Date(effectiveStartTime.getTime() + (totalDuration * i) / 4);
      const position = (i * 25); // 0%, 25%, 50%, 75%, 100%
      
      markers.push(
        <Box
          key={i}
          sx={{
            position: 'absolute',
            bottom: 0,
            left: `${position}%`,
            transform: 'translateX(-50%)',
            height: '8px',
            width: '1px',
            bgcolor: 'grey.500'
          }}
        >
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              bottom: 10,
              left: 0,
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              fontSize: '0.7rem'
            }}
          >
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </Box>
      );
    }
    
    return markers;
  };
  
  const { visibleCRIs, visibleBoluses } = getVisibleMedications();
  
  // Handle medication selection
  const handleCRISelection = (name: string) => {
    setSelectedCRI(name);
    const medication = availableCRIs.find(m => m.name === name);
    if (medication) {
      setCRIUnit(medication.defaultUnit);
    }
  };
  
  const handleBolusSelection = (name: string) => {
    setSelectedBolus(name);
    const medication = availableBoluses.find(m => m.name === name);
    if (medication) {
      setBolusUnit(medication.defaultUnit);
    }
  };

  // Function to calculate vertical position for bolus markers to avoid overlap
  const calculateBolusVerticalPosition = (timestamp: Date, name: string): number => {
    // Group similar medications in same row
    const medicationGroups: { [key: string]: number } = {
      'Propofol': 0,
      'Ketamine': 1,
      'Hydromorphone': 2,
      'Midazolam': 3,
      'Atropine': 4,
      'Glycopyrrolate': 5,
    };
    
    // Get group index for this medication (or default to last group + 1)
    const groupIndex = medicationGroups[name] !== undefined 
      ? medicationGroups[name] 
      : Object.keys(medicationGroups).length;
    
    // Return a percentage based on the group (0% = bottom, ~80% = top)
    return 15 + (groupIndex * 12); // Space rows evenly (roughly 12% apart)
  };

  return (
    <Card sx={{ mb: 3, width: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Medication Administration</Typography>
          <Box>
            <Button 
              variant="outlined" 
              color="primary" 
              sx={{ mr: 1 }}
              onClick={() => setAddCRIOpen(true)}
            >
              Add CRI
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => setAddBolusOpen(true)}
            >
              Add Medication
            </Button>
          </Box>
        </Box>
        
        {/* CRIs Timeline */}
        <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
          Constant Rate Infusions
        </Typography>
        
        <Box 
          sx={{ 
            position: 'relative', 
            height: activeCRIs.length === 0 ? '50px' : `${Math.max(50, visibleCRIs.length * 40)}px`, 
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1
          }}
        >
          {/* Time axis */}
          <Box 
            sx={{ 
              position: 'absolute', 
              bottom: 0, 
              left: 0, 
              right: 0, 
              height: '2px', 
              bgcolor: 'grey.300',
              mx: 2
            }}
          />
          
          {/* Time markers */}
          {generateTimeMarkers()}
          
          {/* CRI bars */}
          {visibleCRIs.length === 0 ? (
            <Typography variant="body2" sx={{ textAlign: 'center', mt: 2, color: 'text.secondary' }}>
              No active infusions
            </Typography>
          ) : (
            visibleCRIs.map((cri, index) => {
              // Find the color for this medication
              const medication = availableCRIs.find(m => m.name === cri.name);
              const color = medication?.color || '#9e9e9e';
              
              return (
                <Box 
                  key={cri.id}
                  sx={{ 
                    position: 'absolute',
                    top: index * 40 + 10,
                    left: `${calculateTimePosition(cri.startTime)}%`,
                    width: `${calculateCRIWidth(cri.startTime, cri.endTime)}%`,
                    height: 30,
                    bgcolor: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 1,
                    borderRadius: '4px',
                    color: '#fff',
                    minWidth: '80px',
                    boxShadow: 1,
                    '&:hover': {
                      opacity: 0.9,
                      boxShadow: 2
                    }
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                    {cri.name} {cri.rate} {cri.unit}
                  </Typography>
                  
                  {!cri.endTime && (
                    <Box>
                      <Tooltip title="Edit Rate">
                        <IconButton 
                          size="small" 
                          sx={{ color: '#fff', p: 0.5 }}
                          onClick={() => handleOpenEditRate(cri.id, cri.rate)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Stop Infusion">
                        <IconButton 
                          size="small" 
                          sx={{ color: '#fff', p: 0.5 }}
                          onClick={() => handleStopCRI(cri.id)}
                        >
                          <StopIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              );
            })
          )}
        </Box>
        
        {/* Bolus Timeline */}
        <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
          Medications
        </Typography>
        
        <Box 
          sx={{ 
            position: 'relative', 
            height: '120px', // Increased height to accommodate staggered rows
            mb: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1
          }}
        >
          {/* Time axis */}
          <Box 
            sx={{ 
              position: 'absolute', 
              bottom: 0, 
              left: 0, 
              right: 0, 
              height: '2px', 
              bgcolor: 'grey.300',
              mx: 2
            }}
          />
          
          {/* Time markers */}
          {generateTimeMarkers()}
          
          {/* Medication group labels on left side */}
          <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '80px', borderRight: '1px dashed rgba(0,0,0,0.1)', px: 1 }}>
            {Object.entries({
              'Propofol': 0,
              'Ketamine': 1,
              'Hydromorphone': 2,
              'Midazolam': 3, 
              'Atropine': 4
            }).map(([name, index]) => (
              <Typography 
                key={name}
                variant="caption" 
                sx={{ 
                  position: 'absolute',
                  left: 0,
                  top: `${15 + (index * 12)}%`,
                  fontSize: '0.65rem',
                  color: 'text.secondary',
                  width: '75px',
                  textAlign: 'right',
                  pr: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {name}
              </Typography>
            ))}
          </Box>
          
          {/* Horizontal grid lines for medication groups */}
          {Object.values({
            'Propofol': 0,
            'Ketamine': 1,
            'Hydromorphone': 2,
            'Midazolam': 3, 
            'Atropine': 4
          }).map((index) => (
            <Box 
              key={`grid-${index}`}
              sx={{ 
                position: 'absolute',
                left: '80px', 
                right: 0,
                top: `${15 + (index * 12)}%`,
                height: '1px',
                bgcolor: 'rgba(0,0,0,0.05)'
              }}
            />
          ))}
          
          {/* Bolus markers */}
          {visibleBoluses.length === 0 ? (
            <Typography variant="body2" sx={{ textAlign: 'center', mt: 2, color: 'text.secondary' }}>
              No medications administered
            </Typography>
          ) : (
            visibleBoluses.map((bolus) => {
              // Find the color for this medication
              const medication = availableBoluses.find(m => m.name === bolus.name);
              const color = medication?.color || '#9e9e9e';
              
              // Calculate vertical position based on medication type
              const verticalPosition = calculateBolusVerticalPosition(bolus.timestamp, bolus.name);
              
              return (
                <Tooltip 
                  key={bolus.id}
                  title={`${bolus.name} ${bolus.dose} ${bolus.unit} at ${bolus.timestamp.toLocaleTimeString()}`}
                >
                  <Box 
                    sx={{ 
                      position: 'absolute',
                      top: `${verticalPosition}%`,
                      left: `${calculateTimePosition(bolus.timestamp)}%`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
                    {/* Diamond shape for bolus with dose indicator */}
                    <Box sx={{ 
                      width: '20px', 
                      height: '20px', 
                      bgcolor: color,
                      transform: 'rotate(45deg)',
                      borderRadius: '2px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      boxShadow: 1
                    }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'white', 
                          fontWeight: 'bold',
                          fontSize: '0.6rem',
                          transform: 'rotate(-45deg)'
                        }}
                      >
                        {bolus.dose}
                      </Typography>
                    </Box>
                    
                    {/* Draw line down to time axis */}
                    <Box sx={{
                      position: 'absolute',
                      top: '10px',
                      width: '1px',
                      height: `calc(100% - ${verticalPosition}% + 5px)`,
                      bgcolor: 'rgba(0,0,0,0.1)',
                      zIndex: 1
                    }} />
                  </Box>
                </Tooltip>
              );
            })
          )}
        </Box>
        
        {/* Legend for bolus medications */}
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-end' }}>
          {availableBoluses.slice(0, 5).map((med) => (
            <Box key={med.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box 
                sx={{ 
                  width: '10px', 
                  height: '10px', 
                  bgcolor: med.color,
                  transform: 'rotate(45deg)',
                  borderRadius: '1px'
                }} 
              />
              <Typography variant="caption" color="text.secondary">
                {med.name}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
      
      {/* Add CRI Dialog */}
      <Dialog open={addCRIOpen} onClose={() => setAddCRIOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Constant Rate Infusion</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Medication</InputLabel>
            <Select
              value={selectedCRI}
              onChange={(e) => handleCRISelection(e.target.value)}
              label="Medication"
            >
              {availableCRIs.map((med) => (
                <MenuItem key={med.name} value={med.name}>
                  {med.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            margin="normal"
            fullWidth
            label="Rate"
            type="number"
            value={criRate}
            onChange={(e) => setCRIRate(e.target.value)}
            InputProps={{
              endAdornment: criUnit
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddCRIOpen(false)}>Cancel</Button>
          <Button onClick={handleAddCRI} variant="contained" color="primary">
            Start Infusion
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Bolus Dialog */}
      <Dialog open={addBolusOpen} onClose={() => setAddBolusOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Medication</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Medication</InputLabel>
            <Select
              value={selectedBolus}
              onChange={(e) => handleBolusSelection(e.target.value)}
              label="Medication"
            >
              {availableBoluses.map((med) => (
                <MenuItem key={med.name} value={med.name}>
                  {med.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            margin="normal"
            fullWidth
            label="Dose"
            type="number"
            value={bolusAmount}
            onChange={(e) => setBolusAmount(e.target.value)}
            InputProps={{
              endAdornment: bolusUnit
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddBolusOpen(false)}>Cancel</Button>
          <Button onClick={handleAddBolus} variant="contained" color="primary">
            Administer
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Rate Dialog */}
      <Dialog open={editRateOpen} onClose={() => setEditRateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Update Infusion Rate</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="normal"
            fullWidth
            label="New Rate"
            type="number"
            value={newRate}
            onChange={(e) => setNewRate(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRateOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateRate} variant="contained" color="primary">
            Update Rate
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default AnesthesiaMedicationChart; 