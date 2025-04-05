import React, { useEffect, useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
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
  Snackbar,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Menu,
  ClickAwayListener,
  CardHeader,
  Divider,
  Autocomplete
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import StopIcon from '@mui/icons-material/Stop';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { AnesthesiaCRI, AnesthesiaBolus } from '../types';
import { addAnesthesiaBolus, addAnesthesiaCRI, updateCRIRate, stopCRI, getAnesthesiaCRIs, getAnesthesiaBoluses } from '../services/patients';
import { format } from 'date-fns';
import { alpha, darken } from '@mui/material/styles';
import html2canvas from 'html2canvas';

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
  { name: 'Propofol', defaultUnit: 'mg', color: '#4fc3f7' },
  { name: 'Ketamine', defaultUnit: 'mg', color: '#64b5f6' },
  { name: 'Hydromorphone', defaultUnit: 'mg', color: '#ffb74d' },
  { name: 'Midazolam', defaultUnit: 'mg', color: '#81c784' },
  { name: 'Atropine', defaultUnit: 'mg', color: '#f48fb1' },
  { name: 'Glycopyrrolate', defaultUnit: 'mg', color: '#ce93d8' },
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
  anesthesiaData?: any;
}

// Define the type for the forwarded ref
export interface AnesthesiaMedicationChartRef {
  getChartImage: () => Promise<string | undefined>;
  getContainer: () => HTMLDivElement | null;
}

const AnesthesiaMedicationChart = forwardRef<AnesthesiaMedicationChartRef, AnesthesiaMedicationChartProps>(({
  patientId,
  vitalSignsStartTime,
  vitalSignsEndTime,
  visibleTimeRange,
  onMedicationAdded,
  currentUser,
  anesthesiaData,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null); // Ref for the main container used for html2canvas

  // Expose the container ref and image getter
  useImperativeHandle(ref, () => ({
    getContainer: () => containerRef.current,
    getChartImage: (): Promise<string | undefined> => {
      return new Promise((resolve) => {
        // Use html2canvas on the containerRef
        const elementToCapture = containerRef.current;
        if (!elementToCapture) {
          console.error('Medication chart container not found for capture.');
          resolve(undefined);
          return;
        }

        console.log('Capturing medication chart container:', elementToCapture);
        // Delay slightly before capture
        setTimeout(() => {
          html2canvas(elementToCapture, {
            logging: true,
            useCORS: true,
            scale: 1, // Start with scale 1
            backgroundColor: '#ffffff', // Ensure white background
            width: elementToCapture.offsetWidth,
            height: elementToCapture.offsetHeight,
            scrollX: 0,
            scrollY: 0,
          }).then(canvas => {
            console.log('Medication chart canvas captured successfully.');
            resolve(canvas.toDataURL('image/png', 1.0));
          }).catch(error => {
            console.error('Error capturing medication chart with html2canvas:', error);
            resolve(undefined);
          });
        }, 150); // 150ms delay
      });
    }
  }));

  // State for CRIs and boluses
  const [activeCRIs, setActiveCRIs] = useState<AnesthesiaCRI[]>([]);
  const [boluses, setBoluses] = useState<AnesthesiaBolus[]>([]);

  // Dialog states
  const [addCRIOpen, setAddCRIOpen] = useState(false);
  const [addBolusOpen, setAddBolusOpen] = useState(false);
  const [editRateOpen, setEditRateOpen] = useState(false);
  
  // Form state
  const [selectedCRI, setSelectedCRI] = useState('');
  const [selectedBolus, setSelectedBolus] = useState<string | { name: string; defaultUnit: string; color: string; } | null>(null);
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
  
  // For the context menu (replacing the existing action menu)
  const [contextMenuAnchor, setContextMenuAnchor] = useState<null | { top: number; left: number }>(null);
  const [contextMenuCRI, setContextMenuCRI] = useState<{id: string, rate: number, name: string} | null>(null);
  
  // Use parent-provided time range or calculate default
  const effectiveStartTime = visibleTimeRange?.start || vitalSignsStartTime || new Date(Date.now() - 3600000); // Default to 1 hour ago if no range
  const effectiveEndTime = visibleTimeRange?.end || vitalSignsEndTime || new Date();
  const totalDuration = effectiveEndTime.getTime() - effectiveStartTime.getTime();

  // Helper to check if a time falls within the effective range
  const isTimeInRange = (time: Date) => {
    return time.getTime() >= effectiveStartTime.getTime() && time.getTime() <= effectiveEndTime.getTime();
  };

  // Fetch medication data from the database
  const fetchMedicationData = useCallback(async () => {
    try {
      console.log('Fetching medication data for patient:', patientId);
      
      // Fetch CRIs and boluses
      const fetchedCRIs = await getAnesthesiaCRIs(patientId);
      const fetchedBoluses = await getAnesthesiaBoluses(patientId);
      
      console.log('Fetched medications:', { 
        cris: fetchedCRIs.length, 
        boluses: fetchedBoluses.length 
      });
      
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
  }, [patientId]);

  useEffect(() => {
    fetchMedicationData();
  }, [fetchMedicationData]);

  // Recalculate visible medications when data or time range changes
  const getVisibleMedications = () => {
    const visibleCRIs = activeCRIs.filter(cri => {
      const criStartTime = cri.startTime instanceof Date ? cri.startTime : new Date(cri.startTime);
      const criEndTime = cri.endTime ? (cri.endTime instanceof Date ? cri.endTime : new Date(cri.endTime)) : effectiveEndTime; // Use effective end if still running
      // Check for overlap
      return criStartTime.getTime() < effectiveEndTime.getTime() && criEndTime.getTime() > effectiveStartTime.getTime();
    });

    const visibleBoluses = boluses.filter(bolus => {
      const bolusTime = bolus.timestamp instanceof Date ? bolus.timestamp : new Date(bolus.timestamp);
      return isTimeInRange(bolusTime);
    });

    return { visibleCRIs, visibleBoluses };
  };

  // Calculate relative time position between two timestamps based on chart range
  const calculateRelativeTimePosition = (timestamp: Date, startTime: Date, endTime: Date): number => {
    const totalRangeDuration = endTime.getTime() - startTime.getTime();
    if (totalRangeDuration <= 0) return 0; // Prevent division by zero
    const position = timestamp.getTime() - startTime.getTime();
    return Math.max(0, Math.min(100, (position / totalRangeDuration) * 100)); // Clamp between 0 and 100
  };
  
  // Calculate positions based on timestamp relative to the chart range
  const calculateTimePosition = (timestamp: Date): number => {
    return calculateRelativeTimePosition(timestamp, effectiveStartTime, effectiveEndTime);
  };

  // Function to calculate CRI bar width percentage
  const calculateCRIWidth = (startTime: Date, endTime?: Date): number => {
    const start = startTime instanceof Date ? startTime : new Date(startTime);
    const end = endTime ? (endTime instanceof Date ? endTime : new Date(endTime)) : effectiveEndTime; // Use effective end if still running

    const clampedStart = Math.max(start.getTime(), effectiveStartTime.getTime());
    const clampedEnd = Math.min(end.getTime(), effectiveEndTime.getTime());

    const duration = clampedEnd - clampedStart;
    if (duration <= 0 || totalDuration <= 0) return 0; // No width if duration is zero or negative

    return Math.max(0, Math.min(100, (duration / totalDuration) * 100)); // Clamp between 0 and 100
  };

  // Handlers for adding/editing medications
  const handleAddCRI = async () => {
    if (!selectedCRI || !criRate || !criUnit) {
      setSnackbar({ open: true, message: 'Please select CRI, rate, and unit', severity: 'error' });
      return;
    }
    try {
      const newCRI: Omit<AnesthesiaCRI, 'id'> = {
        name: selectedCRI,
        startTime: new Date(),
        endTime: undefined,
        rate: parseFloat(criRate),
        unit: criUnit,
        rateHistory: [{ rate: parseFloat(criRate), timestamp: new Date() }],
        administeredBy: currentUser
      };
      await addAnesthesiaCRI(patientId, newCRI);
      setSnackbar({ open: true, message: `${selectedCRI} CRI started`, severity: 'success' });
      if (onMedicationAdded) onMedicationAdded(); // Trigger refresh in parent
      fetchMedicationData(); // Refresh local state
      setAddCRIOpen(false);
      setSelectedCRI('');
      setCRIRate('');
      setCRIUnit('');
    } catch (error) {
      console.error('Error adding CRI:', error);
      setSnackbar({ open: true, message: 'Failed to start CRI', severity: 'error' });
    }
  };

  const handleAddBolus = async () => {
    // Get the medication name from the Autocomplete state
    const medicationName = typeof selectedBolus === 'string' ? selectedBolus : selectedBolus?.name;

    if (!medicationName || !bolusAmount || !bolusUnit) {
      setSnackbar({ open: true, message: 'Please provide medication name, total dose, and unit', severity: 'error' });
      return;
    }
    try {
      const newBolus: Omit<AnesthesiaBolus, 'id'> = {
        name: medicationName.trim(), // Trim whitespace from custom entries
        dose: parseFloat(bolusAmount), // Use the entered total amount directly
        unit: bolusUnit,
        timestamp: new Date(),
        administeredBy: currentUser
      };
      await addAnesthesiaBolus(patientId, newBolus);
      setSnackbar({ open: true, message: `${medicationName} bolus administered`, severity: 'success' });
      if (onMedicationAdded) onMedicationAdded();
      fetchMedicationData();
      setAddBolusOpen(false);
      setSelectedBolus(null); // Reset autocomplete
      setBolusAmount('');
      setBolusUnit(''); // Reset unit
    } catch (error) {
      console.error('Error adding bolus:', error);
      setSnackbar({ open: true, message: 'Failed to administer bolus', severity: 'error' });
    }
  };

  const handleEditRate = async () => {
    if (!editCRIId || !newRate) {
        setSnackbar({ open: true, message: 'Invalid rate', severity: 'error' });
        return;
    }
    try {
        await updateCRIRate(patientId, editCRIId, parseFloat(newRate));
        setSnackbar({ open: true, message: `Rate updated successfully`, severity: 'success' });
        fetchMedicationData(); // Refresh local state
        setEditRateOpen(false);
        setEditCRIId('');
        setNewRate('');
    } catch (error) {
        console.error('Error updating CRI rate:', error);
        setSnackbar({ open: true, message: 'Failed to update rate', severity: 'error' });
    }
  };

  const handleStopCRI = async (criId: string) => {
    try {
      await stopCRI(patientId, criId);
      setSnackbar({ open: true, message: `CRI stopped successfully`, severity: 'success' });
      fetchMedicationData(); // Refresh local state
    } catch (error) {
      console.error('Error stopping CRI:', error);
      setSnackbar({ open: true, message: 'Failed to stop CRI', severity: 'error' });
    }
  };

  const handleOpenContextMenu = (event: React.MouseEvent<HTMLElement>, cri: { id: string; rate: number; name: string }) => {
    event.preventDefault(); // Prevent default right-click menu
    setContextMenuAnchor({ top: event.clientY, left: event.clientX });
    setContextMenuCRI(cri);
  };

  const handleCloseContextMenu = () => {
    setContextMenuAnchor(null);
    setContextMenuCRI(null);
  };

  const handleEditRateFromContextMenu = () => {
    if (contextMenuCRI) {
      setEditCRIId(contextMenuCRI.id);
      setNewRate(contextMenuCRI.rate.toString()); // Pre-fill with current rate
      setEditRateOpen(true);
    }
    handleCloseContextMenu();
  };

  const handleStopCRIFromContextMenu = () => {
    if (contextMenuCRI) {
      handleStopCRI(contextMenuCRI.id);
    }
    handleCloseContextMenu();
  };

  // Generate time markers for the timeline
  const generateTimeMarkers = () => {
    const count = 5; // Number of markers (including start and end)
    const markers = [];
    
    if (totalDuration <= 0) return [];

    for (let i = 0; i < count; i++) {
      const percentage = i / (count - 1) * 100; // 0%, 25%, 50%, 75%, 100%
      const timestamp = new Date(
        effectiveStartTime.getTime() + 
        (effectiveEndTime.getTime() - effectiveStartTime.getTime()) * i / (count - 1)
      );
      
      markers.push({
        position: percentage,
        timestamp
      });
    }
    
    return markers;
  };
  
  // Create markers for the chart
  const timeMarkers = generateTimeMarkers();
  
  const { visibleCRIs, visibleBoluses } = getVisibleMedications();
  
  // Handle medication selection for forms
  const handleCRISelection = (name: string) => {
    setSelectedCRI(name);
    const medication = availableCRIs.find(m => m.name === name);
    if (medication) {
      setCRIUnit(medication.defaultUnit);
    }
  };
  
  // Update bolus selection to set unit when an object is selected
  const handleBolusSelectionChange = (event: React.SyntheticEvent, newValue: string | { name: string; defaultUnit: string; color: string; } | null) => {
    setSelectedBolus(newValue);
    if (typeof newValue === 'object' && newValue !== null) {
      setBolusUnit(newValue.defaultUnit); // Set unit from selected formulary item
    } else {
       // Optionally clear or set a default unit if a custom string is entered or cleared
       // setBolusUnit('mg'); // Example: default to mg for custom
       setBolusUnit(''); // Or clear it to force manual selection/entry
    }
  };

  // Function to calculate vertical position for bolus markers to avoid overlap
  const calculateBolusVerticalPosition = (timestamp: Date, name: string): number => {
    // Group similar medications in same row
    const medicationGroups: { [key: string]: number } = {
      // Example grouping - adjust as needed
      'Propofol': 0,
      'Ketamine': 1,
      'Hydromorphone': 2,
      'Midazolam': 3,
      'Atropine': 4,
      'Glycopyrrolate': 5,
      // Add more common drugs
    };
    
    // Get group index for this medication (or default to last group + 1)
    const groupIndex = medicationGroups[name] !== undefined 
      ? medicationGroups[name] 
      : Object.keys(medicationGroups).length;
    
    // Return a percentage based on the group (e.g., 15% from bottom + 12% per group)
    return 15 + (groupIndex * 12); // Adjust multiplier for spacing
  };

  // Function to get color for medication
  const getMedicationColor = (name: string, type: 'cri' | 'bolus'): string => {
    const list = type === 'cri' ? availableCRIs : availableBoluses;
    const med = list.find(m => m.name === name);
    return med?.color || '#888888'; // Default grey if not found
  };

  return (
    <Card sx={{ mb: 2 }} ref={containerRef}>
      <CardHeader 
        title="Anesthesia Medications & CRIs"
        action={
          <Box>
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<EditIcon />} 
              onClick={() => setAddBolusOpen(true)} 
              sx={{ mr: 1 }}
            >
              Add Bolus
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<EditIcon />} 
              onClick={() => setAddCRIOpen(true)}
            >
              Start CRI
            </Button>
          </Box>
        }
      />
      <Divider />
      <CardContent>
        {/* CRI Timeline */}
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
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
            p: 2,
            overflow: 'hidden'  // Prevent overflow
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
          {timeMarkers.map((marker, i) => (
            <Box
              key={`time-marker-${i}`}
              sx={{
                position: 'absolute',
                bottom: 0,
                left: `${marker.position}%`,
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
                  left: i === 0 ? 10 : i === timeMarkers.length - 1 ? -20 : 0,
                  transform: i === 0 ? 'translateX(0)' : i === timeMarkers.length - 1 ? 'translateX(-80%)' : 'translateX(-50%)', 
                  whiteSpace: 'nowrap',
                  fontSize: '0.7rem'
                }}
              >
                {marker.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          ))}
          
          {/* CRI bars */}
          {visibleCRIs.length === 0 ? (
            <Typography variant="caption" sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'text.secondary' }}>
              No active CRIs in this time range.
            </Typography>
          ) : (
            visibleCRIs.map((cri, index) => {
              const color = getMedicationColor(cri.name, 'cri');
              const startTime = cri.startTime instanceof Date ? cri.startTime : new Date(cri.startTime);
              const endTime = cri.endTime ? (cri.endTime instanceof Date ? cri.endTime : new Date(cri.endTime)) : effectiveEndTime;
              
              const leftPos = calculateTimePosition(startTime);
              const width = calculateCRIWidth(startTime, endTime);
              
              // Skip rendering if width is zero or negative
              if (width <= 0) return null;

              // Handle rate history
              const sortedHistory = cri.rateHistory?.length 
                ? [...cri.rateHistory].sort((a, b) => 
                    (a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp)).getTime() - 
                    (b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp)).getTime()
                  )
                : [];
              
              // Create segments for tooltips if rate changes exist
              const segments: { start: Date; end: Date; rate: number }[] = [];
              if (sortedHistory.length > 0) {
                let lastTime = startTime;
                sortedHistory.forEach((entry, idx) => {
                  const entryTime = entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp);
                  if (idx > 0) {
                    segments.push({ start: lastTime, end: entryTime, rate: sortedHistory[idx - 1].rate });
                  }
                  lastTime = entryTime;
                });
                // Add last segment until end time
                segments.push({ start: lastTime, end: endTime, rate: sortedHistory[sortedHistory.length - 1].rate });
              }

              return (
                <Box
                  key={cri.id}
                  sx={{
                    position: 'absolute',
                    top: index * 40 + 10, // Spacing for each CRI bar
                    left: `${leftPos}%`,
                    width: `${width}%`,
                    height: 30,
                    borderRadius: '4px',
                    boxShadow: 1,
                    overflow: 'visible',
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 2 }
                  }}
                  onClick={(e) => !cri.endTime && handleOpenContextMenu(e, { id: cri.id, rate: cri.rate, name: cri.name })}
                  onContextMenu={(e) => !cri.endTime && handleOpenContextMenu(e, { id: cri.id, rate: cri.rate, name: cri.name })}
                >
                  {/* Main continuous bar */}
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      bgcolor: color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 1,
                      borderRadius: '4px',
                      color: '#fff',
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cri.name} {cri.rate} {cri.unit}
                    </Typography>
                  </Box>
                  
                  {/* Tooltip overlays for segments or whole bar */}
                  {segments.length > 0 ? (
                     segments.map((segment, idx) => {
                        const segStartTime = segment.start instanceof Date ? segment.start : new Date(segment.start);
                        const segEndTime = segment.end instanceof Date ? segment.end : new Date(segment.end);
                        const segLeftPos = calculateRelativeTimePosition(segStartTime, startTime, endTime); // Relative to the bar itself
                        const segWidth = calculateRelativeTimePosition(segEndTime, segStartTime, endTime); // Relative width within the bar
                        
                        return (
                          <Tooltip
                            key={`segment-${idx}`}
                            title={`${cri.name}: ${segment.rate} ${cri.unit} (${segStartTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} - ${segEndTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})})`}
                            placement="top"
                            arrow
                          >
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: `${segLeftPos}%`,
                                width: `${segWidth}%`,
                                height: '100%',
                                cursor: 'pointer',
                                // '&:hover': { background: 'rgba(255,255,255,0.1)' } // Optional hover effect
                              }}
                            />
                          </Tooltip>
                        );
                      })
                  ) : (
                    <Tooltip
                      title={`${cri.name}: ${cri.rate} ${cri.unit} (${startTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} - ${endTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})})`}
                      placement="top"
                      arrow
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          cursor: 'pointer',
                        }}
                      />
                    </Tooltip>
                  )}
                  
                  {/* Vertical change markers */}
                  {sortedHistory.slice(1).map((entry, idx) => {
                    const changeTime = entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp);
                    // Calculate position relative to the start of the *bar*, not the chart
                    const relativePos = calculateRelativeTimePosition(changeTime, startTime, endTime);
                    
                    if (relativePos <= 0 || relativePos >= 100) return null; // Only show within the bar
                    
                    return (
                      <React.Fragment key={`marker-${idx}`}>
                        <Box
                          sx={{
                            position: 'absolute',
                            left: `${relativePos}%`,
                            top: 0,
                            height: '100%',
                            width: '2px',
                            bgcolor: 'rgba(255,255,255,0.9)',
                            pointerEvents: 'none'
                          }}
                        />
                        <Tooltip title={`Rate changed to ${entry.rate} ${cri.unit} at ${changeTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`}>
                          <Box
                            sx={{
                              position: 'absolute',
                              left: `${relativePos}%`,
                              top: -18,
                              transform: 'translateX(-50%)',
                              bgcolor: 'white',
                              color: 'text.primary',
                              px: 0.5,
                              py: 0.25,
                              borderRadius: 1,
                              fontSize: '0.65rem',
                              fontWeight: 'bold',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                              border: '1px solid',
                              borderColor: 'divider',
                              pointerEvents: 'none',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {entry.rate}
                          </Box>
                        </Tooltip>
                      </React.Fragment>
                    );
                  })}
                </Box>
              );
            })
          )}
        </Box>
        
        {/* Bolus Timeline */}
        <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
          Bolus Medications
        </Typography>
        <Box 
          sx={{ 
            position: 'relative', 
            height: '120px',
            mb: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 2,
            overflow: 'hidden'  // Prevent overflow
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
          {timeMarkers.map((marker, i) => (
            <Box
              key={`bolus-time-marker-${i}`}
              sx={{
                position: 'absolute',
                bottom: 0,
                left: `${marker.position}%`,
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
                  left: i === 0 ? 10 : i === timeMarkers.length - 1 ? -20 : 0,
                  transform: i === 0 ? 'translateX(0)' : i === timeMarkers.length - 1 ? 'translateX(-80%)' : 'translateX(-50%)', 
                  whiteSpace: 'nowrap',
                  fontSize: '0.7rem'
                }}
              >
                {marker.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          ))}
          
          {/* Background medication name labels - only for administered medications */}
          {[...new Set(visibleBoluses.map(b => b.name))].map((name, index) => (
             <Typography
                key={`label-${name}`}
                variant="caption"
                sx={{
                  position: 'absolute',
                  left: 15,
                  bottom: `${calculateBolusVerticalPosition(new Date(), name)}%`,
                  transform: 'translateY(50%)',
                  color: 'text.disabled',
                  fontSize: '0.7rem'
                }}
              >
                {name}
              </Typography>
          ))}

          {/* Bolus markers (Diamonds) */}
          {visibleBoluses.map((bolus) => {
            const timestamp = bolus.timestamp instanceof Date ? bolus.timestamp : new Date(bolus.timestamp);
            const color = getMedicationColor(bolus.name, 'bolus');
            const position = calculateTimePosition(timestamp);
            const verticalPosition = calculateBolusVerticalPosition(timestamp, bolus.name);

            return (
              <Tooltip
                key={bolus.id}
                title={`${bolus.name} ${bolus.dose} ${bolus.unit} at ${timestamp.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`}
                placement="top"
                arrow
              >
                <Box
                  sx={{
                    position: 'absolute',
                    left: `${position}%`,
                    bottom: `${verticalPosition}%`,
                    width: '10px',
                    height: '10px',
                    bgcolor: color,
                    transform: 'translate(-50%, 50%) rotate(45deg)', // Diamond shape centered on time
                    borderRadius: '1px',
                    cursor: 'pointer',
                  }}
                />
              </Tooltip>
            );
          })}

          {visibleBoluses.length === 0 && (
              <Typography variant="caption" sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'text.secondary' }}>
                  No bolus medications in this time range.
              </Typography>
          )}
        </Box>
        
        {/* Legend for Bolus medications */}
        <Box sx={{ 
          mt: 1, 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 1, 
          bgcolor: 'rgba(0,0,0,0.02)', 
          p: 1, 
          borderRadius: 1 
        }}>
          {[...new Set(visibleBoluses.map(b => b.name))].map(name => {
            const color = getMedicationColor(name, 'bolus');
            return (
              <Box 
                key={`legend-${name}`}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mr: 2,
                  bgcolor: 'white',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Box 
                  sx={{ 
                    width: '10px', 
                    height: '10px', 
                    transform: 'rotate(45deg)',
                    borderRadius: '1px',
                    bgcolor: color,
                    mr: 1
                  }} 
                />
                <Typography variant="caption" sx={{ fontWeight: 'medium' }}>{name}</Typography>
              </Box>
            );
          })}
        </Box>
      </CardContent>
      
      {/* Add CRI Dialog */}
      <Dialog open={addCRIOpen} onClose={() => setAddCRIOpen(false)}>
        <DialogTitle>Start New CRI</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel id="cri-select-label">Medication</InputLabel>
            <Select
              labelId="cri-select-label"
              value={selectedCRI}
              onChange={(e) => handleCRISelection(e.target.value)}
              label="Medication"
            >
              {availableCRIs.map(med => (
                <MenuItem key={med.name} value={med.name}>{med.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Rate"
            type="number"
            value={criRate}
            onChange={(e) => setCRIRate(e.target.value)}
            fullWidth
            margin="normal"
            InputProps={{
              endAdornment: <Typography variant="caption">{criUnit}</Typography>,
            }}
          />
          {/* Consider adding unit selection if needed */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddCRIOpen(false)}>Cancel</Button>
          <Button onClick={handleAddCRI} variant="contained">Start CRI</Button>
        </DialogActions>
      </Dialog>

      {/* Add Bolus Dialog - Updated */}
      <Dialog open={addBolusOpen} onClose={() => setAddBolusOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Administer Bolus</DialogTitle>
        <DialogContent>
          <Autocomplete
            freeSolo // Allow custom text entry
            options={availableBoluses} // Use predefined list as suggestions
            getOptionLabel={(option) => typeof option === 'string' ? option : option.name} // How to display options
            value={selectedBolus}
            onChange={handleBolusSelectionChange}
            onInputChange={(event, newInputValue) => {
              // If user types custom value not matching an object, update state
              if (availableBoluses.findIndex(opt => opt.name === newInputValue) === -1) {
                 // Check if the input change is different from the current object's name
                 if (typeof selectedBolus !== 'string' && selectedBolus?.name !== newInputValue) {
                    setSelectedBolus(newInputValue); 
                    setBolusUnit('mg'); // Default to mg for custom entry, or clear it
                 }
              }
            }}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="Medication Name" 
                margin="normal" 
                variant="outlined" 
              />
            )}
            renderOption={(props, option) => (
                <li {...props} key={option.name}>
                  {option.name}
                </li>
            )}
            isOptionEqualToValue={(option, value) => {
                // Handles comparing selected object/string with options
                if (typeof value === 'string') {
                    return option.name === value; // Compare option name to string value
                } else if (value) {
                    return option.name === value.name; // Compare option name to selected object name
                }
                return false;
            }}
          />
          <TextField
            label="Total Dose" // Changed label
            type="number"
            value={bolusAmount}
            onChange={(e) => setBolusAmount(e.target.value)}
            fullWidth
            margin="normal"
            required // Mark as required
            InputProps={{
                // Removed endAdornment showing unit automatically
            }}
          />
           <TextField // Add a separate field for the unit
            label="Unit"
            type="text"
            value={bolusUnit}
            onChange={(e) => setBolusUnit(e.target.value)}
            fullWidth
            margin="normal"
            required // Mark as required
            placeholder="e.g., mg, mcg"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddBolusOpen(false)}>Cancel</Button>
          <Button onClick={handleAddBolus} variant="contained">Administer</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Rate Dialog */}
      <Dialog open={editRateOpen} onClose={() => setEditRateOpen(false)}>
        <DialogTitle>Edit CRI Rate</DialogTitle>
        <DialogContent>
          <TextField
            label="New Rate"
            type="number"
            value={newRate}
            onChange={(e) => setNewRate(e.target.value)}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRateOpen(false)}>Cancel</Button>
          <Button onClick={handleEditRate} variant="contained">Update Rate</Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu for CRIs */}
      {contextMenuAnchor && contextMenuCRI && (
        <Box
          sx={{
            position: 'fixed',
            top: contextMenuAnchor.top,
            left: contextMenuAnchor.left,
            bgcolor: 'background.paper',
            borderRadius: 1,
            boxShadow: 3,
            zIndex: 9999,
            overflow: 'hidden',
            minWidth: 180
          }}
        >
          <Box sx={{ py: 1, px: 2, bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="subtitle2">{contextMenuCRI.name}</Typography>
          </Box>
          
          <Box 
            sx={{ 
              p: 1, 
              display: 'flex', 
              flexDirection: 'column' 
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            <Button
              startIcon={<EditIcon />}
              onClick={handleEditRateFromContextMenu}
              sx={{ justifyContent: 'flex-start', mb: 1 }}
            >
              Edit Rate
            </Button>
            <Button
              startIcon={<StopIcon />}
              onClick={handleStopCRIFromContextMenu}
              color="error"
              sx={{ justifyContent: 'flex-start' }}
            >
              Stop Infusion
            </Button>
          </Box>
        </Box>
      )}
      
      {/* Overlay to capture clicks outside the context menu */}
      {contextMenuAnchor && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9998
          }}
          onClick={handleCloseContextMenu} // Close when clicking outside
        />
      )}

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
}); // Close forwardRef

export default AnesthesiaMedicationChart; 