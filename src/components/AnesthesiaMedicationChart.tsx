import React, { useEffect, useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  Typography,
  Box,
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
  Divider,
  Autocomplete,
  CircularProgress,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Switch,
  FormControlLabel
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import StopIcon from '@mui/icons-material/Stop';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { AnesthesiaCRI, AnesthesiaBolus, FormularyDrug } from '../types';
import { addAnesthesiaBolus, addAnesthesiaCRI, updateCRIRate, stopCRI, getAnesthesiaCRIs, getAnesthesiaBoluses } from '../services/patients';
import { format } from 'date-fns';
import { alpha, darken, useTheme } from '@mui/material/styles';
import html2canvas from 'html2canvas';
import { getAllFormularyDrugs } from '../services/formulary';
import { calculateMedicationTotals } from '../utils/calculations';
import { PLOT_AREA_LEFT, PLOT_AREA_RIGHT, generate5MinTicks } from '../utils/chartConstants';

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

// Type for data in a medication swimlane
interface MedicationLaneData {
  name: string;
  cris: AnesthesiaCRI[];
  boluses: AnesthesiaBolus[];
  color: string; // For visualization
  formularyDrug?: FormularyDrug; // If available
}

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
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  // Error state for error boundary-like behavior
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Data states
  const [activeCRIs, setActiveCRIs] = useState<AnesthesiaCRI[]>([]);
  const [boluses, setBoluses] = useState<AnesthesiaBolus[]>([]);
  const [formularyDrugs, setFormularyDrugs] = useState<FormularyDrug[]>([]);
  const [loading, setLoading] = useState(true);
  const [lanes, setLanes] = useState<MedicationLaneData[]>([]);
  const [medicationTotals, setMedicationTotals] = useState<Record<string, { totalAmount: number; unit: string }>>({});
  const [showTotals, setShowTotals] = useState(true);

  // Dialog states
  const [addCRIOpen, setAddCRIOpen] = useState(false);
  const [addBolusOpen, setAddBolusOpen] = useState(false);
  const [editRateOpen, setEditRateOpen] = useState(false);

  // Form states for CRI
  const [selectedCRIDrug, setSelectedCRIDrug] = useState<FormularyDrug | string | null>(null);
  const [customCRIName, setCustomCRIName] = useState('');
  const [criRate, setCRIRate] = useState('');
  const [criUnit, setCRIUnit] = useState('');

  // Form states for Bolus
  const [selectedBolusDrug, setSelectedBolusDrug] = useState<FormularyDrug | string | null>(null);
  const [customBolusName, setCustomBolusName] = useState('');
  const [bolusAmount, setBolusAmount] = useState('');
  const [bolusUnit, setBolusUnit] = useState('');
  const [bolusTime, setBolusTime] = useState<string>(new Date().toISOString().slice(0, 16));
  const [criStartTime, setCriStartTime] = useState<string>(new Date().toISOString().slice(0, 16));

  // Edit CRI Rate states
  const [editCRIId, setEditCRIId] = useState('');
  const [editCRIName, setEditCRIName] = useState('');
  const [currentRate, setCurrentRate] = useState('');
  const [newRate, setNewRate] = useState('');

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  // Time range calculation
  const effectiveStartTime = visibleTimeRange?.start || vitalSignsStartTime || new Date(Date.now() - 3600000); // Default to 1 hour ago
  const effectiveEndTime = visibleTimeRange?.end || vitalSignsEndTime || new Date();
  const timeRange = effectiveEndTime.getTime() - effectiveStartTime.getTime();

  // Expose the container ref for capturing
  useImperativeHandle(ref, () => ({
    getContainer: () => containerRef.current,
    getChartImage: async (): Promise<string | undefined> => {
      if (containerRef.current && !loading && !hasError) {
        try {
          console.log('Creating chart image...');
          const canvas = await html2canvas(containerRef.current, {
            scale: 2, // Higher resolution
            logging: false,
            backgroundColor: '#ffffff',
            allowTaint: true,
            useCORS: true
          });
          return canvas.toDataURL('image/png');
        } catch (error) {
          console.error('Error generating chart image:', error);
          return undefined;
        }
      }
      return undefined;
    }
  }));

  // Reset error state if patientId changes
  useEffect(() => {
    setHasError(false);
    setErrorMessage('');
  }, [patientId]);

  // Fetch formulary data
  useEffect(() => {
    const fetchFormularyDrugs = async () => {
      try {
        const drugs = await getAllFormularyDrugs();
        setFormularyDrugs(drugs);
      } catch (error) {
        console.error('Error fetching formulary drugs:', error);
        setSnackbar({
          open: true,
          message: 'Error loading formulary',
          severity: 'error'
        });
      }
    };

    fetchFormularyDrugs();
  }, []);

  // Fetch medication data
  const fetchMedicationData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching medication data for patient:', patientId);

      // Make sure patientId is valid before proceeding
      if (!patientId) {
        console.error('Cannot fetch medication data: patientId is missing');
        setHasError(true);
        setErrorMessage('Patient ID is missing');
        setLoading(false);
        return;
      }

      const [fetchedCRIs, fetchedBoluses] = await Promise.all([
        getAnesthesiaCRIs(patientId),
        getAnesthesiaBoluses(patientId)
      ]);

      console.log('Fetched medications:', {
        cris: fetchedCRIs.length,
        boluses: fetchedBoluses.length
      });

      setActiveCRIs(fetchedCRIs);
      setBoluses(fetchedBoluses);

      // Calculate medication totals
      const procedureEndTime = new Date(); // Current time as end time
      const patientWeight = anesthesiaData?.patientWeight
        ? parseFloat(anesthesiaData.patientWeight)
        : undefined;

      // Make sure we have valid arrays before calculating totals
      if (Array.isArray(fetchedBoluses) && Array.isArray(fetchedCRIs)) {
        const totals = calculateMedicationTotals(
          fetchedBoluses,
          fetchedCRIs,
          procedureEndTime,
          patientWeight
        );

        setMedicationTotals(totals);
      } else {
        console.error('Invalid data for medication totals:', { fetchedBoluses, fetchedCRIs });
        setMedicationTotals({});
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching medication data:', error);
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load medication data');
      setSnackbar({
        open: true,
        message: 'Failed to load anesthesia medications',
        severity: 'error'
      });
      setLoading(false);
    }
  }, [patientId, anesthesiaData]);

  // Initial data load
  useEffect(() => {
    console.log('Initial data load triggered with patientId:', patientId);
    if (patientId) {
      fetchMedicationData();
    }
  }, [fetchMedicationData, patientId]);

  // Process data into lanes
  useEffect(() => {
    if (!loading) {
      console.log('Processing data into lanes:', {
        activeCRIs: activeCRIs.length,
        boluses: boluses.length,
        formularyDrugs: formularyDrugs.length
      });

      try {
        // Create a map of medication names to their data
        const lanes: Record<string, MedicationLaneData> = {};

        // First, get all unique medication names
        const medicationNames = new Set<string>();

        // Add all CRI medication names
        activeCRIs.forEach(cri => {
          if (cri.name) {
            medicationNames.add(cri.name);
          }
        });

        // Add all bolus medication names
        boluses.forEach(bolus => {
          if (bolus.name) {
            medicationNames.add(bolus.name);
          }
        });

        // Sort the names for consistency
        const sortedNames = Array.from(medicationNames).sort();
        console.log('Found medication names:', sortedNames);

        // Create lane for each medication
        sortedNames.forEach(name => {
          // Find corresponding formulary drug if it exists
          const formularyDrug = formularyDrugs.find(drug =>
            drug.name.toLowerCase() === name.toLowerCase());

          // Find corresponding color from our predefined lists, or use a default
          let color = '#9e9e9e'; // Default gray

          // Try to find the medication in our predefined lists
          const criDrug = availableCRIs.find(drug =>
            drug.name.toLowerCase() === name.toLowerCase());

          const bolusDrug = availableBoluses.find(drug =>
            drug.name.toLowerCase() === name.toLowerCase());

          if (criDrug) {
            color = criDrug.color;
          } else if (bolusDrug) {
            color = bolusDrug.color;
          } else if (formularyDrug && formularyDrug.category) {
            // Use category-based colors for formulary drugs
            switch (formularyDrug.category.toLowerCase()) {
              case 'analgesic':
              case 'opioid':
                color = '#ffb74d'; // Orange
                break;
              case 'sedative':
                color = '#81c784'; // Green
                break;
              case 'nsaid':
                color = '#64b5f6'; // Blue
                break;
              case 'anesthetic':
                color = '#9575cd'; // Purple
                break;
              case 'reversal agent':
                color = '#f48fb1'; // Pink
                break;
              case 'anticholinergic':
                color = '#ce93d8'; // Light purple
                break;
              case 'fluid':
                color = '#e0e0e0'; // Light gray
                break;
              default:
                // Generate a color based on the name for consistency
                const hash = name.split('').reduce((acc, char) => {
                  return char.charCodeAt(0) + ((acc << 5) - acc);
                }, 0);
                const h = Math.abs(hash) % 360;
                color = `hsl(${h}, 70%, 80%)`;
            }
          }

          // Initialize the lane
          lanes[name] = {
            name,
            cris: activeCRIs.filter(cri => cri.name === name),
            boluses: boluses.filter(bolus => bolus.name === name),
            color,
            formularyDrug
          };
        });

        // Convert to array and sort by name
        const newLanes = Object.values(lanes).sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        console.log('Created lanes:', newLanes.length);
        setLanes(newLanes);
      } catch (error) {
        console.error('Error processing medication data:', error);
        setHasError(true);
        setErrorMessage('Error processing medication data');
      }
    }
  }, [activeCRIs, boluses, formularyDrugs, loading]);

  // Time position calculations
  const calculateTimePosition = (timestamp: Date): number => {
    const time = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const position = time.getTime() - effectiveStartTime.getTime();
    const percentage = (position / timeRange) * 100;
    return Math.max(0, Math.min(100, percentage)); // Clamp between 0-100%
  };

  const calculateBarWidth = (startTime: Date, endTime?: Date): number => {
    const start = startTime instanceof Date ? startTime : new Date(startTime);
    const end = endTime instanceof Date
      ? endTime
      : endTime
        ? new Date(endTime)
        : effectiveEndTime;

    const startPos = Math.max(start.getTime(), effectiveStartTime.getTime());
    const endPos = Math.min(end.getTime(), effectiveEndTime.getTime());
    const width = ((endPos - startPos) / timeRange) * 100;

    return Math.max(0, Math.min(100, width)); // Clamp between 0-100%
  };

  // Helper to get the medication name from form state
  const getCRIMedicationName = (): string => {
    if (selectedCRIDrug) {
      // If it's a FormularyDrug object
      if (typeof selectedCRIDrug === 'object' && selectedCRIDrug !== null) {
        return selectedCRIDrug.name;
      }
      // If it's a string (custom input)
      if (typeof selectedCRIDrug === 'string') {
        return selectedCRIDrug;
      }
    }

    if (customCRIName.trim()) {
      return customCRIName.trim();
    }

    return '';
  };

  const getBolusMedicationName = (): string => {
    if (selectedBolusDrug) {
      // If it's a FormularyDrug object
      if (typeof selectedBolusDrug === 'object' && selectedBolusDrug !== null) {
        return selectedBolusDrug.name;
      }
      // If it's a string (custom input)
      if (typeof selectedBolusDrug === 'string') {
        return selectedBolusDrug;
      }
    }

    if (customBolusName.trim()) {
      return customBolusName.trim();
    }

    return '';
  };

  // Handlers for adding medications
  const handleAddCRI = async () => {
    try {
      const medicationName = getCRIMedicationName();

      console.log('Adding CRI:', {
        medicationName,
        criRate,
        criUnit,
        selectedCRIDrug: typeof selectedCRIDrug === 'object' && selectedCRIDrug ? selectedCRIDrug.name : selectedCRIDrug,
        customCRIName
      });

      if (!medicationName || !criRate || !criUnit) {
        console.error('Validation failed:', { medicationName, criRate, criUnit });
        setSnackbar({
          open: true,
          message: 'Please provide medication name, rate, and unit',
          severity: 'error'
        });
        return;
      }

      const parsedRate = parseFloat(criRate);
      if (isNaN(parsedRate)) {
        console.error('Invalid rate value:', criRate);
        setSnackbar({
          open: true,
          message: 'Please enter a valid number for the rate',
          severity: 'error'
        });
        return;
      }

      console.log('Creating new CRI object');

      const newCRI: Omit<AnesthesiaCRI, 'id'> = {
        name: medicationName,
        startTime: new Date(criStartTime),
        endTime: undefined,
        rate: parsedRate,
        unit: criUnit,
        rateHistory: [{
          timestamp: new Date(criStartTime),
          rate: parsedRate
        }],
        administeredBy: currentUser
      };

      console.log('Sending new CRI to API:', JSON.stringify(newCRI));
      console.log('Patient ID:', patientId);

      const response = await addAnesthesiaCRI(patientId, newCRI);

      console.log('CRI added successfully with ID:', response);

      setSnackbar({
        open: true,
        message: `${medicationName} CRI started at ${criRate} ${criUnit}`,
        severity: 'success'
      });

      // Refresh data
      if (onMedicationAdded) onMedicationAdded();
      await fetchMedicationData();

      // Reset form
      setAddCRIOpen(false);
      setSelectedCRIDrug(null);
      setCustomCRIName('');
      setCRIRate('');
      setCRIUnit('');
      setCriStartTime(new Date().toISOString().slice(0, 16));

    } catch (error) {
      console.error('Error adding CRI:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.stack);
      }
      setSnackbar({
        open: true,
        message: 'Failed to start CRI: ' + (error instanceof Error ? error.message : String(error)),
        severity: 'error'
      });
    }
  };

  const handleAddBolus = async () => {
    const medicationName = getBolusMedicationName();

    if (!medicationName || !bolusAmount || !bolusUnit) {
      setSnackbar({
        open: true,
        message: 'Please provide medication name, dose, and unit',
        severity: 'error'
      });
      return;
    }

    try {
      const newBolus: Omit<AnesthesiaBolus, 'id'> = {
        name: medicationName,
        dose: parseFloat(bolusAmount),
        unit: bolusUnit,
        timestamp: new Date(bolusTime),
        administeredBy: currentUser
      };

      await addAnesthesiaBolus(patientId, newBolus);

      setSnackbar({
        open: true,
        message: `${medicationName} bolus administered: ${bolusAmount} ${bolusUnit}`,
        severity: 'success'
      });

      // Refresh data
      if (onMedicationAdded) onMedicationAdded();
      fetchMedicationData();

      // Reset form
      setAddBolusOpen(false);
      setSelectedBolusDrug(null);
      setCustomBolusName('');
      setBolusAmount('');
      setCustomBolusName('');
      setBolusAmount('');
      setBolusUnit('');
      setBolusTime(new Date().toISOString().slice(0, 16));

    } catch (error) {
      console.error('Error adding bolus:', error);
      setSnackbar({
        open: true,
        message: 'Failed to administer bolus',
        severity: 'error'
      });
    }
  };

  const handleEditRate = async () => {
    if (!editCRIId || !newRate) {
      setSnackbar({
        open: true,
        message: 'Please enter a new rate',
        severity: 'error'
      });
      return;
    }

    try {
      await updateCRIRate(patientId, editCRIId, parseFloat(newRate));

      setSnackbar({
        open: true,
        message: `${editCRIName} rate updated to ${newRate}`,
        severity: 'success'
      });

      // Refresh data
      fetchMedicationData();

      // Reset form
      setEditRateOpen(false);
      setEditCRIId('');
      setEditCRIName('');
      setCurrentRate('');
      setNewRate('');

    } catch (error) {
      console.error('Error updating CRI rate:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update rate',
        severity: 'error'
      });
    }
  };

  const handleStopCRI = async (criId: string, criName: string) => {
    try {
      // Ask for confirmation
      if (!window.confirm(`Are you sure you want to stop the ${criName} CRI?`)) {
        return;
      }

      await stopCRI(patientId, criId);

      setSnackbar({
        open: true,
        message: `${criName} CRI stopped successfully`,
        severity: 'success'
      });

      // Refresh data
      await fetchMedicationData();

    } catch (error) {
      console.error('Error stopping CRI:', error);
      setSnackbar({
        open: true,
        message: 'Failed to stop CRI: ' + (error instanceof Error ? error.message : String(error)),
        severity: 'error'
      });
    }
  };

  // Open edit rate dialog with pre-filled data
  const handleOpenEditRateDialog = (cri: AnesthesiaCRI) => {
    setEditCRIId(cri.id);
    setEditCRIName(cri.name);
    setCurrentRate(cri.rate.toString());
    setNewRate(cri.rate.toString()); // Default to current rate
    setEditRateOpen(true);
  };

  // Generate 5-minute grid lines (shared with VitalSignsChart for pixel-perfect alignment)
  const renderGridLines = () => {
    if (!effectiveStartTime || !effectiveEndTime) return null;

    const ticks = generate5MinTicks(
      effectiveStartTime.getTime(),
      effectiveEndTime.getTime(),
    );

    return ticks.map((tickMs) => {
      const position = ((tickMs - effectiveStartTime.getTime()) / timeRange) * 100;
      if (position < 0 || position > 100) return null;

      return (
        <Box
          key={`grid-${tickMs}`}
          sx={{
            position: 'absolute',
            left: `${position}%`,
            top: 0,
            bottom: 0,
            width: 0,
            borderLeft: '1px dashed',
            borderColor: 'divider',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
      );
    });
  };

  // Render a single lane for a medication
  const renderLane = (lane: MedicationLaneData, index: number) => {
    return (
      <Box
        key={`lane-${lane.name}`}
        sx={{
          display: 'flex',
          height: '50px',
          marginBottom: '1px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          backgroundColor: index % 2 === 0
            ? alpha(lane.color, 0.04)
            : alpha(lane.color, 0.10),
          '&:hover': {
            backgroundColor: alpha(lane.color, 0.16),
          },
          transition: 'background-color 0.15s ease',
        }}
      >
        {/* Fixed-width label column — matches VitalSignsChart left offset */}
        <Box
          sx={{
            width: `${PLOT_AREA_LEFT}px`,
            minWidth: `${PLOT_AREA_LEFT}px`,
            display: 'flex',
            alignItems: 'flex-start',
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              width: '100%',
              padding: '4px 6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: theme.palette.text.primary,
              backgroundColor: alpha(lane.color, 0.22),
              borderRadius: '0 0 4px 0',
              letterSpacing: '0.01em',
            }}
          >
            {lane.name}
          </Typography>
        </Box>

        {/* Data area — percentage positioning aligns with VitalSignsChart plot area */}
        <Box
          sx={{
            position: 'relative',
            flex: 1,
            mr: `${PLOT_AREA_RIGHT}px`,
          }}
        >
        {/* Grid lines */}
        {renderGridLines()}

        {/* Render CRIs as horizontal bars */}
        {lane.cris.map(cri => {
          const startTime = cri.startTime instanceof Date ? cri.startTime : new Date(cri.startTime);
          const endTime = cri.endTime ? (cri.endTime instanceof Date ? cri.endTime : new Date(cri.endTime)) : undefined;

          const startPosition = calculateTimePosition(startTime);
          const width = calculateBarWidth(startTime, endTime);

          if (width <= 0) return null; // Skip if outside visible range

          // Generate rate history tooltip content
          const rateHistoryContent = cri.rateHistory && cri.rateHistory.length > 0 ? (
            <React.Fragment>
              <Typography variant="caption" sx={{ fontWeight: 'bold', mt: 1 }}>Rate History:</Typography>
              {cri.rateHistory.map((ratePoint, idx) => {
                const pointTime = ratePoint.timestamp instanceof Date
                  ? ratePoint.timestamp
                  : new Date(ratePoint.timestamp);

                return (
                  <Typography key={idx} variant="caption" display="block" sx={{ pl: 1 }}>
                    {format(pointTime, 'HH:mm:ss')}: {ratePoint.rate} {cri.unit}
                    {idx === 0 ? ' (initial)' : ''}
                  </Typography>
                );
              })}
            </React.Fragment>
          ) : null;

          return (
            <Tooltip
              key={`cri-${cri.id}`}
              title={
                <React.Fragment>
                  <Typography variant="body2">{lane.name} CRI</Typography>
                  <Typography variant="caption" display="block">
                    Current Rate: {cri.rate} {cri.unit}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Started: {format(startTime, 'HH:mm:ss')}
                  </Typography>
                  {endTime && (
                    <Typography variant="caption" display="block">
                      Stopped: {format(endTime, 'HH:mm:ss')}
                    </Typography>
                  )}
                  {!endTime && (
                    <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
                      Currently active
                    </Typography>
                  )}
                  {rateHistoryContent}
                </React.Fragment>
              }
            >
              <Box
                sx={{
                  position: 'absolute',
                  left: `${startPosition}%`,
                  width: `${width}%`,
                  top: '20px', // Below the label
                  height: '20px',
                  backgroundColor: lane.color,
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: '0 0 0 2px rgba(0,0,0,0.2)',
                  },
                  '&::after': width < 5 ? {
                    content: '""',
                    position: 'absolute',
                    left: '100%',
                    top: 0,
                    height: '100%',
                    width: '20px' // Invisible extension for hover detection
                  } : {}
                }}
                onClick={() => !endTime && handleOpenEditRateDialog(cri)}
              >
                {width > 8 && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.getContrastText(lane.color),
                      fontSize: '0.6rem',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      padding: '0 4px'
                    }}
                  >
                    {cri.rate} {cri.unit}
                  </Typography>
                )}

                {/* Render rate change markers */}
                {cri.rateHistory && cri.rateHistory.length > 1 &&
                  cri.rateHistory.slice(1).map((rateChange, idx) => {
                    const changeTime = rateChange.timestamp instanceof Date
                      ? rateChange.timestamp
                      : new Date(rateChange.timestamp);

                    // Skip if change time is outside the visible range or after end time
                    if (endTime && changeTime > endTime) return null;

                    const changePosition = calculateTimePosition(changeTime);
                    const relativePosition = (changePosition - startPosition) / (width / 100);

                    // Skip if outside the bar's width
                    if (relativePosition < 0 || relativePosition > 100) return null;

                    // Find previous rate for comparison
                    let prevRate: number | null = null;

                    if (cri.rateHistory && cri.rateHistory.length > 1) {
                      // Safely find the index of the current rate change
                      const currentIndex = cri.rateHistory.findIndex(r => {
                        const rTime = r.timestamp instanceof Date ? r.timestamp : new Date(r.timestamp);
                        return rTime.getTime() === changeTime.getTime();
                      });

                      // If we found it and it's not the first item, get the previous rate
                      if (currentIndex > 0) {
                        prevRate = cri.rateHistory[currentIndex - 1].rate;
                      }
                    }

                    const rateDirection = prevRate !== null
                      ? (rateChange.rate > prevRate ? '↑' : rateChange.rate < prevRate ? '↓' : '→')
                      : '';

                    return (
                      <Tooltip
                        key={`rate-change-${cri.id}-${idx}`}
                        title={
                          <React.Fragment>
                            <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
                              Rate Change
                            </Typography>
                            <Typography variant="caption" display="block">
                              At: {format(changeTime, 'HH:mm:ss')}
                            </Typography>
                            {prevRate !== null && (
                              <Typography variant="caption" display="block">
                                From: {prevRate} {cri.unit}
                              </Typography>
                            )}
                            <Typography variant="caption" display="block">
                              To: {rateChange.rate} {cri.unit}
                            </Typography>
                          </React.Fragment>
                        }
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            left: `${relativePosition}%`,
                            top: 0,
                            height: '100%',
                            width: '2px',
                            backgroundColor: darken(lane.color, 0.3),
                            zIndex: 5,
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: '-3px',
                              width: '8px',
                              height: '8px',
                              backgroundColor: darken(lane.color, 0.3),
                              borderRadius: '50%'
                            },
                            '&:hover': {
                              width: '3px',
                              backgroundColor: darken(lane.color, 0.5),
                              '&::after': {
                                backgroundColor: darken(lane.color, 0.5),
                                width: '10px',
                                height: '10px',
                                left: '-4px'
                              }
                            }
                          }}
                        />
                      </Tooltip>
                    );
                  })
                }
              </Box>
            </Tooltip>
          );
        })}

        {/* Render Boluses as markers */}
        {lane.boluses.map(bolus => {
          const bolusTime = bolus.timestamp instanceof Date ? bolus.timestamp : new Date(bolus.timestamp);
          const position = calculateTimePosition(bolusTime);

          if (position < 0 || position > 100) return null; // Skip if outside visible range

          return (
            <Tooltip
              key={`bolus-${bolus.id}`}
              title={
                <React.Fragment>
                  <Typography variant="body2">{lane.name} Bolus</Typography>
                  <Typography variant="caption" display="block">
                    Dose: {bolus.dose} {bolus.unit}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Time: {format(bolusTime, 'HH:mm:ss')}
                  </Typography>
                </React.Fragment>
              }
            >
              <Box
                sx={{
                  position: 'absolute',
                  left: `${position}%`,
                  top: '10px',
                  width: '10px',
                  height: '10px',
                  transform: 'translate(-50%, 0)',
                  backgroundColor: lane.color,
                  border: `2px solid ${darken(lane.color, 0.2)}`,
                  borderRadius: '50%',
                  zIndex: 5
                }}
              />
            </Tooltip>
          );
        })}
        </Box>{/* end data area */}
      </Box>
    );
  };

  // Main render function
  return (
    <Box ref={containerRef}>
      {/* Header bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Anesthesia Medications
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={showTotals}
                onChange={(e) => setShowTotals(e.target.checked)}
                size="small"
              />
            }
            label="Show Totals"
            sx={{ mr: 2 }}
          />
          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={() => setAddCRIOpen(true)}
            disabled={hasError}
          >
            Add CRI
          </Button>
          <Button
            size="small"
            variant="contained"
            color="secondary"
            onClick={() => setAddBolusOpen(true)}
            disabled={hasError}
          >
            Add Bolus
          </Button>
        </Box>
      </Box>
      <Divider />
      <Box sx={{ px: 0, pt: 1 }}>
        {hasError ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="error" gutterBottom>
              Error loading medication chart
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {errorMessage || 'An unexpected error occurred'}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setHasError(false);
                fetchMedicationData();
              }}
              sx={{ mt: 1 }}
            >
              Retry
            </Button>
          </Box>
        ) : loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : lanes.length === 0 ? (
          <Typography align="center" sx={{ py: 2, color: 'text.secondary' }}>
            No medications administered yet
          </Typography>
        ) : (
          <>
            {/* Medication Totals Section — color-coded chip grid */}
            <Collapse in={showTotals}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ px: 2, py: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: alpha(theme.palette.grey[50], 0.5) }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.75, display: 'block' }}>
                    Medication Totals
                  </Typography>
                  {Object.entries(medicationTotals).length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {Object.entries(medicationTotals).map(([name, data]) => {
                        const drugColor = lanes.find(l => l.name === name)?.color || '#9e9e9e';
                        return (
                          <Box key={name} sx={{
                            display: 'flex', alignItems: 'center', gap: 0.75,
                            px: 1.25, py: 0.5,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: alpha(drugColor, 0.3),
                            backgroundColor: alpha(drugColor, 0.06),
                          }}>
                            <Box sx={{
                              width: 10, height: 10, borderRadius: '2px', flexShrink: 0,
                              backgroundColor: drugColor,
                            }} />
                            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.73rem', lineHeight: 1.3 }}>
                              {name}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.73rem', color: 'text.secondary', lineHeight: 1.3 }}>
                              {data.totalAmount.toFixed(2)} {data.unit}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No medications administered yet.</Typography>
                  )}
                </Box>
              </Box>
            </Collapse>

            {/* Medication lanes — data area aligns with VitalSignsChart plot area */}
            <Box sx={{ position: 'relative' }}>
              {lanes.map((lane, index) => renderLane(lane, index))}
            </Box>
          </>
        )}

        {/* Add CRI Dialog */}
        <Dialog
          open={addCRIOpen}
          onClose={() => setAddCRIOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Start CRI</DialogTitle>
          <DialogContent>
            <Autocomplete
              freeSolo
              options={formularyDrugs}
              getOptionLabel={(option) => {
                // Handle both string input and formulary drug objects
                if (typeof option === 'string') {
                  return option;
                }
                return option.name;
              }}
              renderOption={(props, option) => (
                <li {...props} key={typeof option === 'string' ? `string-${option}` : `drug-${option.id}`}>
                  {typeof option === 'string' ? option : option.name}
                </li>
              )}
              value={selectedCRIDrug}
              onChange={(event, newValue) => {
                if (typeof newValue === 'string') {
                  // User entered a custom string
                  setSelectedCRIDrug(null);
                  setCustomCRIName(newValue);
                } else if (newValue) {
                  // User selected from formulary
                  setSelectedCRIDrug(newValue);
                  setCustomCRIName('');
                } else {
                  // Cleared selection
                  setSelectedCRIDrug(null);
                  setCustomCRIName('');
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Medication"
                  margin="normal"
                  variant="outlined"
                  placeholder="Enter medication name or search formulary"
                  fullWidth
                  required
                />
              )}
            />

            <TextField
              label="Start Time"
              type="datetime-local"
              value={criStartTime}
              onChange={(e) => setCriStartTime(e.target.value)}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />

            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <TextField
                label="Rate"
                type="number"
                value={criRate}
                onChange={(e) => setCRIRate(e.target.value)}
                margin="normal"
                variant="outlined"
                fullWidth
                required
                inputProps={{ min: 0, step: 0.1 }}
              />

              <FormControl fullWidth margin="normal" variant="outlined" required>
                <InputLabel id="cri-unit-label">Unit</InputLabel>
                <Select
                  labelId="cri-unit-label"
                  value={criUnit}
                  onChange={(e) => setCRIUnit(e.target.value)}
                  label="Unit"
                >
                  <MenuItem value="mcg/kg/min">mcg/kg/min</MenuItem>
                  <MenuItem value="mcg/kg/hr">mcg/kg/hr</MenuItem>
                  <MenuItem value="mg/kg/hr">mg/kg/hr</MenuItem>
                  <MenuItem value="mL/hr">mL/hr</MenuItem>
                  <MenuItem value="mL/kg/hr">mL/kg/hr</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddCRIOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCRI} variant="contained" color="primary">
              Start CRI
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Bolus Dialog */}
        <Dialog
          open={addBolusOpen}
          onClose={() => setAddBolusOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Administer Bolus</DialogTitle>
          <DialogContent>
            <Autocomplete
              freeSolo
              options={formularyDrugs}
              getOptionLabel={(option) => {
                // Handle both string input and formulary drug objects
                if (typeof option === 'string') {
                  return option;
                }
                return option.name;
              }}
              renderOption={(props, option) => (
                <li {...props} key={typeof option === 'string' ? `string-${option}` : `drug-${option.id}`}>
                  {typeof option === 'string' ? option : option.name}
                </li>
              )}
              value={selectedBolusDrug}
              onChange={(event, newValue) => {
                if (typeof newValue === 'string') {
                  // User entered a custom string
                  setSelectedBolusDrug(null);
                  setCustomBolusName(newValue);
                } else if (newValue) {
                  // User selected from formulary
                  setSelectedBolusDrug(newValue);
                  setCustomBolusName('');
                } else {
                  // Cleared selection
                  setSelectedBolusDrug(null);
                  setCustomBolusName('');
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Medication"
                  margin="normal"
                  variant="outlined"
                  placeholder="Enter medication name or search formulary"
                  fullWidth
                  required
                />
              )}
            />

            <TextField
              label="Administer Time"
              type="datetime-local"
              value={bolusTime}
              onChange={(e) => setBolusTime(e.target.value)}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />

            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <TextField
                label="Total Dose"
                type="number"
                value={bolusAmount}
                onChange={(e) => setBolusAmount(e.target.value)}
                margin="normal"
                variant="outlined"
                fullWidth
                required
                inputProps={{ min: 0, step: 0.1 }}
              />

              <FormControl fullWidth margin="normal" variant="outlined" required>
                <InputLabel id="bolus-unit-label">Unit</InputLabel>
                <Select
                  labelId="bolus-unit-label"
                  value={bolusUnit}
                  onChange={(e) => setBolusUnit(e.target.value)}
                  label="Unit"
                >
                  <MenuItem value="mg">mg</MenuItem>
                  <MenuItem value="mcg">mcg</MenuItem>
                  <MenuItem value="mL">mL</MenuItem>
                  <MenuItem value="mg/kg">mg/kg</MenuItem>
                  <MenuItem value="mcg/kg">mcg/kg</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddBolusOpen(false)}>Cancel</Button>
            <Button onClick={handleAddBolus} variant="contained" color="primary">
              Administer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit CRI Rate Dialog */}
        <Dialog
          open={editRateOpen}
          onClose={() => setEditRateOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Edit CRI Rate: {editCRIName}</DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Current Rate: {currentRate}
              </Typography>

              <TextField
                label="New Rate"
                type="number"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                fullWidth
                required
                inputProps={{ min: 0, step: 0.1 }}
                sx={{ mb: 2 }}
              />

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<StopIcon />}
                  onClick={() => {
                    // Close the edit dialog
                    setEditRateOpen(false);
                    // Call the stop function
                    handleStopCRI(editCRIId, editCRIName);
                  }}
                  sx={{
                    py: 1,
                    fontWeight: 'bold',
                    width: '100%'
                  }}
                >
                  Stop CRI
                </Button>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditRateOpen(false)}>Cancel</Button>
            <Button
              onClick={handleEditRate}
              variant="contained"
              color="primary"
              disabled={!newRate || newRate === currentRate}
            >
              Update Rate
            </Button>
          </DialogActions>
        </Dialog>

        {/* Feedback Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>{/* end content area */}
    </Box>
  );
});

export default AnesthesiaMedicationChart; 