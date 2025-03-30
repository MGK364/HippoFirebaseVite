import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid as MuiGrid,
  Paper,
  Divider,
  FormControlLabel,
  Checkbox,
  IconButton,
  Tooltip,
  Stack,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
  List,
  ListItem,
  ListItemText,
  Popper,
  ClickAwayListener,
  Grow,
  Paper as MuiPaper,
  ToggleButton,
  RadioGroup,
  Radio,
  CircularProgress
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { AnesthesiaPlan } from '../types';
import { getAllFormularyDrugs } from '../services/formulary';
import { FormularyDrug, OtherTechniqueItem, LocalRegionalItem } from '../types';

interface AnesthesiaPlanFormProps {
  initialPlan: Omit<AnesthesiaPlan, 'id'>;
  onSave: (plan: Omit<AnesthesiaPlan, 'id'>) => Promise<void>;
  patientWeight: string;
  isLoading?: boolean;
}

// Define interfaces for different medication types to match AnesthesiaPlan type
interface PremedicationItem {
  name: string;
  route: string;
  dosageRange: string;
  anticipatedDose: string;
  concentration: string;
  volume: string;
}

interface InductionAgentItem {
  name: string;
  route: string;
  dosageRange: string;
  anticipatedDose: string;
  concentration?: string;
  volume?: string;
}

interface IVFluidItem {
  name: string;
  rate: string;
  mlPerHr: string;
  dropsPerSec?: string;
  bolusVolume?: string;
  additives?: string;
}

interface CRIItem {
  name: string;
  loadingDose?: string;
  dosageRange: string;
  concentration?: string;
}

interface EmergencyDrugItem {
  name: string;
  dosage: string;
  dose: string;
  volume: string;
  concentration: string;
}

// First, add a constant for common IV fluids
const COMMON_IV_FLUIDS = [
  'Plasmalyte',
  'Lactated Ringers',
  'Normal Saline (0.9%)',
  'Half Strength Saline (0.45%)',
  'Hypertonic Saline (3%)',
  'Hypertonic Saline (7%)',
  'Mannitol',
  'Vetstarch'
];

// Second, add a constant for local anesthetics
const LOCAL_ANESTHETICS = [
  'Lidocaine',
  'Bupivacaine',
  'Mepivacaine',
  'Ropivacaine',
  'Liposomal Bupivacaine',
  'Morphine (Epidural or Joint)'
];

// Add constants for emergency drugs and reversals with their standard dosages and concentrations
const EMERGENCY_DRUGS = [
  {
    name: 'Epinephrine',
    dogDosage: '0.01',
    catDosage: '0.01',
    concentration: '1',
    color: '#FFE0E0'
  },
  {
    name: 'Atropine',
    dogDosage: '0.04',
    catDosage: '0.04',
    concentration: '0.4'
  },
  {
    name: 'Glycopyrrolate',
    dogDosage: '0.01',
    catDosage: '0.01',
    concentration: '0.2'
  },
  {
    name: 'Lidocaine',
    dogDosage: '2',
    catDosage: '1',
    concentration: '20'
  },
  {
    name: 'Naloxone',
    dogDosage: '0.04',
    catDosage: '0.04',
    concentration: '0.4'
  },
  {
    name: 'Flumazenil',
    dogDosage: '0.01',
    catDosage: '0.01',
    concentration: '0.1'
  },
  {
    name: 'Atipamezole',
    dogDosage: '',
    catDosage: '',
    concentration: '5'
  }
];

const DEFAULT_PREMEDICATION: PremedicationItem = {
  name: '',
  route: 'IV',
  dosageRange: '',
  anticipatedDose: '',
  concentration: '',
  volume: ''
};

const DEFAULT_INDUCTION_AGENT: InductionAgentItem = {
  name: '',
  route: 'IV',
  dosageRange: '',
  anticipatedDose: '',
  concentration: '',
  volume: ''
};

const DEFAULT_IV_FLUID: IVFluidItem = {
  name: '',
  rate: '',
  mlPerHr: '',
  dropsPerSec: '',
  bolusVolume: '',
  additives: ''
};

const DEFAULT_CRI: CRIItem = {
  name: '',
  loadingDose: '',
  dosageRange: '',
  concentration: ''
};

const DEFAULT_OTHER_TECHNIQUE: OtherTechniqueItem = {
  name: '',
  drugs: [],
  dosage: '',
  dosageRange: '',
  anticipatedDose: '',
  concentration: '',
  volume: ''
};

const DEFAULT_EMERGENCY_DRUG: EmergencyDrugItem = {
  name: '',
  dosage: '',
  dose: '',
  volume: '',
  concentration: ''
};

const DEFAULT_LOCAL_REGIONAL: LocalRegionalItem = {
  name: '',
  technique: '',
  drugs: [],
  dosage: '',
  dosageRange: '',
  anticipatedDose: '',
  concentration: '',
  volume: '',
  additives: ''
};

const ROUTE_OPTIONS = ['IV', 'IM', 'SQ', 'PO', 'Inhalant', 'Topical', 'Other'];
const RECOVERY_AREAS = ['Anesthesia', 'ICU', 'Outpatient', 'Overnight', 'Other'];

// Emergency Drug Card Component 
interface EmergencyDrugCardProps {
  drugName: string;
  dogDosage?: string;
  catDosage?: string;
  concentration: string;
  patientWeight: string;
  drugColor?: string;
  onAdd?: (drug: { name: string; dose: string; volume: string }) => void;
}

const EmergencyDrugCard: React.FC<EmergencyDrugCardProps> = ({
  drugName,
  dogDosage,
  catDosage,
  concentration,
  patientWeight,
  drugColor,
  onAdd
}) => {
  // Auto-calculate the dose and volume
  const [calculatedDose, setCalculatedDose] = useState('');
  const [calculatedVolume, setCalculatedVolume] = useState('');
  const [customDose, setCustomDose] = useState('');

  useEffect(() => {
    if (drugName !== 'Atipamezole' && patientWeight && dogDosage) {
      try {
        const dose = (parseFloat(dogDosage) * parseFloat(patientWeight)).toFixed(2);
        setCalculatedDose(dose);
        
        if (concentration) {
          const volume = (parseFloat(dose) / parseFloat(concentration)).toFixed(2);
          setCalculatedVolume(volume);
        }
      } catch (err) {
        console.error(`Error calculating for ${drugName}:`, err);
      }
    }
  }, [drugName, dogDosage, patientWeight, concentration]);

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: drugColor ? alpha(drugColor, 0.05) : undefined
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>{drugName}</Typography>
      
      {drugName !== 'Atipamezole' ? (
        <>
          <Typography variant="body2">{dogDosage} mg/kg</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2">Dose: {calculatedDose} mg</Typography>
            <Typography variant="body2">Vol: {calculatedVolume} mL</Typography>
          </Box>
          <Typography variant="body2" sx={{ mt: 1 }}>{concentration} mg/mL</Typography>
          
          {onAdd && (
            <Button 
              size="small" 
              variant="outlined" 
              sx={{ mt: 1 }}
              onClick={() => onAdd({
                name: drugName,
                dose: calculatedDose,
                volume: calculatedVolume
              })}
            >
              Add to Plan
            </Button>
          )}
        </>
      ) : (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 1 }}>
            <TextField
              label="10x dex dose"
              size="small"
              variant="outlined"
              value={customDose}
              onChange={(e) => {
                const value = e.target.value;
                setCustomDose(value);
                let volume = '';
                try {
                  if (value) {
                    volume = (parseFloat(value) / 5).toFixed(2); // 5 mg/mL concentration
                    setCalculatedVolume(volume);
                  }
                } catch (err) {
                  console.error('Error calculating Atipamezole volume:', err);
                }
              }}
              InputProps={{
                endAdornment: <InputAdornment position="end">mg</InputAdornment>,
              }}
              sx={{ width: '100%' }}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Dose: {customDose ? customDose : '-'}</Typography>
            <Typography variant="body2">Vol: {calculatedVolume ? calculatedVolume : '-'} mL</Typography>
          </Box>
          <Typography variant="body2" sx={{ mt: 1 }}>5 mg/mL</Typography>
          
          {onAdd && customDose && (
            <Button 
              size="small" 
              variant="outlined" 
              sx={{ mt: 1 }}
              onClick={() => onAdd({
                name: drugName,
                dose: customDose,
                volume: calculatedVolume
              })}
            >
              Add to Plan
            </Button>
          )}
        </>
      )}
    </Paper>
  );
};

const AnesthesiaPlanForm: React.FC<AnesthesiaPlanFormProps> = ({ 
  initialPlan, 
  onSave, 
  patientWeight,
  isLoading = false 
}) => {
  const [plan, setPlan] = useState<Omit<AnesthesiaPlan, 'id'>>(initialPlan);
  
  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formularyDrugs, setFormularyDrugs] = useState<FormularyDrug[]>([]);
  const [isLoadingDrugs, setIsLoadingDrugs] = useState(false);
  
  // State for custom autocomplete
  const [searchText, setSearchText] = useState<Record<string, string>>({});
  const [dropdownOpen, setDropdownOpen] = useState<Record<string, boolean>>({});
  const [filteredDrugs, setFilteredDrugs] = useState<Record<string, FormularyDrug[]>>({});
  const searchRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  // Reset form when initialPlan changes
  useEffect(() => {
    setPlan(initialPlan);
  }, [initialPlan]);

  // Load formulary drugs on component mount
  useEffect(() => {
    const loadFormularyDrugs = async () => {
      setIsLoadingDrugs(true);
      try {
        const drugs = await getAllFormularyDrugs();
        setFormularyDrugs(drugs);
      } catch (error) {
        console.error('Error loading formulary drugs:', error);
      } finally {
        setIsLoadingDrugs(false);
      }
    };

    loadFormularyDrugs();
  }, []);

  // Helper function to calculate anticipated dose based on dosage and weight
  const calculateAnticipatedDose = (dosage: string): string => {
    try {
      // Extract the numeric value from dosage (e.g., "0.05-0.2" -> use the higher value 0.2)
      const dosageMatch = dosage.match(/([0-9]*[.])?[0-9]+/g);
      if (!dosageMatch || dosageMatch.length === 0) return '';
      
      // Use the last match which is typically the higher value in a range
      const dosageValue = parseFloat(dosageMatch[dosageMatch.length - 1]);
      const weight = parseFloat(patientWeight);
      
      if (isNaN(dosageValue) || isNaN(weight)) return '';
      
      // Calculate dose in mg
      const dose = dosageValue * weight;
      return dose.toFixed(2); // Format to 2 decimal places
    } catch (e) {
      console.error('Error calculating anticipated dose:', e);
      return '';
    }
  };

  // Helper function to calculate volume based on anticipated dose and concentration
  const calculateVolume = (anticipatedDose: string, concentration: string): string => {
    try {
      const dose = parseFloat(anticipatedDose);
      
      // Extract the numeric value from concentration (e.g., "10mg/ml" -> 10)
      const concentrationMatch = concentration.match(/([0-9]*[.])?[0-9]+/g);
      if (!concentrationMatch || concentrationMatch.length === 0) return '';
      
      const concentrationValue = parseFloat(concentrationMatch[0]);
      
      if (isNaN(dose) || isNaN(concentrationValue) || concentrationValue === 0) return '';
      
      // Calculate volume in ml
      const volume = dose / concentrationValue;
      return volume.toFixed(2); // Format to 2 decimal places
    } catch (e) {
      console.error('Error calculating volume:', e);
      return '';
    }
  };

  // Calculate ml/hr based on ml/kg/hr and patient weight
  const calculateMlPerHr = (mlPerKgHr: string): string => {
    if (!mlPerKgHr || !patientWeight) return '';
    
    const rate = parseFloat(mlPerKgHr);
    const weight = parseFloat(patientWeight);
    
    if (isNaN(rate) || isNaN(weight)) return '';
    
    return (rate * weight).toFixed(1);
  };

  // Handle text field changes
  const handleTextChange = (field: keyof Omit<AnesthesiaPlan, 'id'>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlan(prev => ({ ...prev, [field]: e.target.value }));
  };

  // Handle select field changes
  const handleSelectChange = (field: keyof Omit<AnesthesiaPlan, 'id'>) => (
    e: React.ChangeEvent<{ name?: string; value: unknown }>
  ) => {
    setPlan(prev => ({ ...prev, [field]: e.target.value }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (field: keyof Omit<AnesthesiaPlan, 'id'>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlan(prev => ({ ...prev, [field]: e.target.checked }));
  };

  // Handle nested monitoring plan checkbox changes
  const handleMonitoringChange = (field: keyof AnesthesiaPlan['monitoringPlan']) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlan(prev => ({
      ...prev,
      monitoringPlan: {
        ...prev.monitoringPlan,
        [field]: e.target.checked
      }
    }));
  };

  // Handle IV catheter checkbox changes
  const handleIVCChange = (field: keyof AnesthesiaPlan['monitoringPlan']['ivcs']) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPlan(prev => ({
        ...prev,
        monitoringPlan: {
          ...prev.monitoringPlan,
          ivcs: {
            ...prev.monitoringPlan.ivcs,
            [field]: e.target.checked
          }
        }
      }));
    };

  // Add premedication
  const addPremedication = () => {
    setPlan(prev => ({
      ...prev,
      premedications: [...prev.premedications, { ...DEFAULT_PREMEDICATION }]
    }));
  };

  // Add induction agent
  const addInductionAgent = () => {
    setPlan(prev => ({
      ...prev,
      inductionAgents: [...prev.inductionAgents, { ...DEFAULT_INDUCTION_AGENT }]
    }));
  };

  // Add IV fluid
  const addIVFluid = () => {
    setPlan(prev => ({
      ...prev,
      ivFluids: [...prev.ivFluids, { ...DEFAULT_IV_FLUID }]
    }));
  };

  // Add CRI
  const addCRI = () => {
    setPlan(prev => ({
      ...prev,
      cris: [...prev.cris, { ...DEFAULT_CRI }]
    }));
  };

  // Add other technique
  const addOtherTechnique = () => {
    setPlan(prev => ({
      ...prev,
      otherTechniques: [...prev.otherTechniques, { ...DEFAULT_OTHER_TECHNIQUE }]
    }));
  };

  // Add emergency drug
  const addEmergencyDrug = () => {
    setPlan(prev => ({
      ...prev,
      emergencyDrugs: [...prev.emergencyDrugs, { ...DEFAULT_EMERGENCY_DRUG }]
    }));
  };

  // Add local regional anesthesia
  const addLocalRegional = () => {
    setPlan(prev => ({
      ...prev,
      localRegional: [...(prev.localRegional || []), { ...DEFAULT_LOCAL_REGIONAL }]
    }));
  };

  // Update premedication - modified to handle auto calculations
  const updatePremedication = (index: number, field: keyof PremedicationItem, value: string) => {
    setPlan(prev => {
      const updatedItems = [...prev.premedications];
      const currentItem = { ...updatedItems[index] };
      
      // Update the specified field
      currentItem[field] = value;
      
      // Auto-calculate anticipated dose if dosage range is changed
      if (field === 'dosageRange') {
        currentItem.anticipatedDose = calculateAnticipatedDose(value);
        
        // Also update volume if concentration is already set
        if (currentItem.concentration) {
          currentItem.volume = calculateVolume(currentItem.anticipatedDose, currentItem.concentration);
        }
      }
      
      // Auto-calculate volume if concentration or anticipated dose changes
      if (field === 'concentration' || field === 'anticipatedDose') {
        // Only update if both anticipated dose and concentration are available
        if (currentItem.anticipatedDose && currentItem.concentration) {
          currentItem.volume = calculateVolume(currentItem.anticipatedDose, currentItem.concentration);
        }
      }
      
      updatedItems[index] = currentItem;
      return { ...prev, premedications: updatedItems };
    });
  };

  // Update induction agent - modified to handle auto calculations
  const updateInductionAgent = (index: number, field: keyof InductionAgentItem, value: string) => {
    setPlan(prev => {
      const updatedItems = [...prev.inductionAgents];
      const currentItem = { ...updatedItems[index] };
      
      // Update the specified field
      currentItem[field] = value;
      
      // Auto-calculate anticipated dose if dosage range is changed
      if (field === 'dosageRange') {
        currentItem.anticipatedDose = calculateAnticipatedDose(value);
        
        // Also update volume if concentration is already set
        if (currentItem.concentration) {
          currentItem.volume = calculateVolume(currentItem.anticipatedDose, currentItem.concentration);
        }
      }
      
      // Auto-calculate volume if concentration or anticipated dose changes
      if (field === 'concentration' || field === 'anticipatedDose') {
        // Only update if both anticipated dose and concentration are available
        if (currentItem.anticipatedDose && currentItem.concentration) {
          currentItem.volume = calculateVolume(currentItem.anticipatedDose, currentItem.concentration);
        }
      }
      
      updatedItems[index] = currentItem;
      return { ...prev, inductionAgents: updatedItems };
    });
  };

  // Function to get input ID for drug search
  const getInputId = (type: 'premedication' | 'induction' | 'cri', index: number) => {
    return `${type}-${index}`;
  };

  // Function to handle drug search
  const handleDrugSearch = (type: 'premedication' | 'induction' | 'cri', index: number, value: string) => {
    const inputId = getInputId(type, index);
    setSearchText(prev => ({ ...prev, [inputId]: value }));
    
    // Filter drugs by search term
    if (value.trim().length > 0) {
      const filtered = formularyDrugs.filter(drug => 
        drug.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredDrugs(prev => ({ ...prev, [inputId]: filtered }));
      setDropdownOpen(prev => ({ ...prev, [inputId]: true }));
    } else {
      setDropdownOpen(prev => ({ ...prev, [inputId]: false }));
    }
  };

  // Function to handle drug selection
  const handleDrugSelect = (type: 'premedication' | 'induction' | 'cri', index: number, drugName: string) => {
    const inputId = getInputId(type, index);
    
    // Close dropdown and update search text
    setDropdownOpen(prev => ({ ...prev, [inputId]: false }));
    setSearchText(prev => ({ ...prev, [inputId]: drugName }));
    
    // Update the plan
    if (type === 'premedication') {
      setPlan(prev => {
        const updatedItems = [...prev.premedications];
      updatedItems[index] = { 
        ...updatedItems[index], 
          name: drugName 
        };
        return { ...prev, premedications: updatedItems };
      });
    } else if (type === 'induction') {
      setPlan(prev => {
        const updatedItems = [...prev.inductionAgents];
        updatedItems[index] = { 
          ...updatedItems[index], 
          name: drugName 
      };
      return { ...prev, inductionAgents: updatedItems };
      });
    } else if (type === 'cri') {
      setPlan(prev => {
        const updatedItems = [...prev.cris];
        updatedItems[index] = { 
          ...updatedItems[index], 
          name: drugName 
        };
        return { ...prev, cris: updatedItems };
      });
    }
  };

  // Close dropdown when clicking away
  const handleClickAway = (inputId: string) => {
    setDropdownOpen(prev => ({ ...prev, [inputId]: false }));
  };

  // Update IV fluid
  const updateIVFluid = (index: number, field: keyof IVFluidItem, value: string) => {
    setPlan(prev => {
      const updatedItems = [...prev.ivFluids];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value
      };
      
      // Auto-calculate mlPerHr when rate changes
      if (field === 'rate') {
        updatedItems[index].mlPerHr = calculateMlPerHr(value);
      }
      
      return { ...prev, ivFluids: updatedItems };
    });
  };

  // Update CRI
  const updateCRI = (index: number, field: keyof CRIItem, value: string) => {
    setPlan(prev => {
      const updatedItems = [...prev.cris];
      updatedItems[index] = { 
        ...updatedItems[index], 
        [field]: value 
      };
      return { ...prev, cris: updatedItems };
    });
  };

  // Update other technique
  const updateOtherTechnique = (index: number, field: keyof OtherTechniqueItem, value: any) => {
    setPlan(prev => {
      const updatedItems = [...prev.otherTechniques];
      
      if (field === 'drugs' && typeof value === 'string') {
        updatedItems[index] = {
          ...updatedItems[index],
          drugs: value.split(',').map(drug => drug.trim())
        };
      } else {
        updatedItems[index] = {
          ...updatedItems[index],
          [field]: value
        };
        
        // Auto-calculate anticipated dose if dosage range changes
        if (field === 'dosageRange' && patientWeight && value) {
          try {
            updatedItems[index].anticipatedDose = calculateAnticipatedDose(value);
          } catch (error) {
            console.error('Error calculating anticipated dose:', error);
          }
        }
        
        // Auto-calculate volume if anticipated dose or concentration changes
        if ((field === 'anticipatedDose' || field === 'concentration') && 
            updatedItems[index].anticipatedDose && 
            updatedItems[index].concentration) {
          try {
            updatedItems[index].volume = calculateVolume(
              updatedItems[index].anticipatedDose,
              updatedItems[index].concentration
            );
          } catch (error) {
            console.error('Error calculating volume:', error);
          }
        }
      }
      
      return { ...prev, otherTechniques: updatedItems };
    });
  };

  // Update emergency drug
  const updateEmergencyDrug = (index: number, field: keyof EmergencyDrugItem, value: string) => {
    setPlan(prev => {
      const updatedItems = [...prev.emergencyDrugs];
      updatedItems[index] = { 
        ...updatedItems[index], 
        [field]: value 
      };
      
      // Auto calculations for emergency drugs
      if (field === 'name') {
        // Find predefined values for the selected drug
        const selectedDrug = EMERGENCY_DRUGS.find(drug => drug.name === value);
        if (selectedDrug) {
          updatedItems[index].dosage = selectedDrug.dosage;
          updatedItems[index].concentration = selectedDrug.concentration;
          
          // Calculate dose and volume if patient weight is available
          if (patientWeight && selectedDrug.dosage) {
            // For Atipamezole, we don't auto-calculate dosage
            if (value !== 'Atipamezole') {
              try {
                // Calculate dose (mg) = dosage (mg/kg) * weight (kg)
                const dose = (parseFloat(selectedDrug.dosage) * parseFloat(patientWeight)).toFixed(2);
                updatedItems[index].dose = dose;
                
                // Calculate volume (ml) = dose (mg) / concentration (mg/ml)
                if (selectedDrug.concentration) {
                  const volume = (parseFloat(dose) / parseFloat(selectedDrug.concentration)).toFixed(2);
                  updatedItems[index].volume = volume;
                }
              } catch (err) {
                console.error('Error calculating emergency drug dose/volume:', err);
              }
            }
          }
        }
      }
      
      // For Atipamezole, calculate volume when dose is manually entered
      if (field === 'dose' && updatedItems[index].name === 'Atipamezole' && value) {
        try {
          // Calculate volume (ml) = dose (mg) / concentration (mg/ml)
          const volume = (parseFloat(value) / parseFloat(updatedItems[index].concentration)).toFixed(2);
          updatedItems[index].volume = volume;
        } catch (err) {
          console.error('Error calculating Atipamezole volume:', err);
        }
      }
      
      return { ...prev, emergencyDrugs: updatedItems };
    });
  };

  // Update local regional
  const updateLocalRegional = (index: number, field: keyof LocalRegionalItem, value: string) => {
    setPlan(prev => {
      const updatedItems = [...(prev.localRegional || [])];
      
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value
      };
      
      // Auto-calculate anticipated dose if dosage range changes
      if (field === 'dosageRange' && patientWeight && value) {
        try {
          updatedItems[index].anticipatedDose = calculateAnticipatedDose(value);
        } catch (error) {
          console.error('Error calculating anticipated dose:', error);
        }
      }
      
      // Auto-calculate volume if anticipated dose or concentration changes
      if ((field === 'anticipatedDose' || field === 'concentration') && 
          updatedItems[index].anticipatedDose && 
          updatedItems[index].concentration) {
        try {
          updatedItems[index].volume = calculateVolume(
            updatedItems[index].anticipatedDose,
            updatedItems[index].concentration
          );
        } catch (error) {
          console.error('Error calculating volume:', error);
        }
      }
      
      return { ...prev, localRegional: updatedItems };
    });
  };

  // Remove medication item
  const removePremedication = (index: number) => {
    setPlan(prev => {
      const updatedItems = [...prev.premedications];
      updatedItems.splice(index, 1);
      return { ...prev, premedications: updatedItems };
    });
  };

  const removeInductionAgent = (index: number) => {
    setPlan(prev => {
      const updatedItems = [...prev.inductionAgents];
      updatedItems.splice(index, 1);
      return { ...prev, inductionAgents: updatedItems };
    });
  };

  const removeIVFluid = (index: number) => {
    setPlan(prev => {
      const updatedItems = [...prev.ivFluids];
      updatedItems.splice(index, 1);
      return { ...prev, ivFluids: updatedItems };
    });
  };

  const removeCRI = (index: number) => {
    setPlan(prev => {
      const updatedItems = [...prev.cris];
      updatedItems.splice(index, 1);
      return { ...prev, cris: updatedItems };
    });
  };

  const removeOtherTechnique = (index: number) => {
    setPlan(prev => {
      const updatedItems = [...prev.otherTechniques];
      updatedItems.splice(index, 1);
      return { ...prev, otherTechniques: updatedItems };
    });
  };

  const removeLocalRegional = (index: number) => {
    setPlan(prev => {
      const updatedItems = [...(prev.localRegional || [])];
      updatedItems.splice(index, 1);
      return { ...prev, localRegional: updatedItems };
    });
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    const newErrors: Record<string, string> = {};
    
    // Required fields validation
    if (!plan.maintenance) {
      newErrors.maintenance = 'Maintenance anesthesia is required';
    }
    
    if (plan.premedications.some(med => !med.name)) {
      newErrors.premedications = 'All premedication names are required';
    }
    
    if (plan.inductionAgents.some(med => !med.name)) {
      newErrors.inductionAgents = 'All induction agent names are required';
    }
    
    setErrors(newErrors);
    
    // If no errors, proceed with save
    if (Object.keys(newErrors).length === 0) {
      // Update timestamps
      const updatedPlan = {
        ...plan,
        updatedAt: new Date()
      };
      
      await onSave(updatedPlan);
    }
  };

  // Fix the ref assignment issue
  const assignRef = (inputId: string, el: HTMLDivElement | null) => {
    searchRefs.current[inputId] = el;
  };

  // Handle setting local regional drug properties
  const handleSetLocalRegional = (index: number, field: keyof LocalRegionalItem, value: any) => {
    const updatedLocalRegional = [...(plan.localRegional || [])];
    updatedLocalRegional[index] = {
      ...updatedLocalRegional[index],
      [field]: value
    };
    
    // Auto-calculate anticipated dose if dosage range changes
    if (field === 'dosageRange' && patientWeight && value) {
      try {
        updatedLocalRegional[index].anticipatedDose = calculateAnticipatedDose(value);
        
        // Also update volume if concentration is already set
        if (updatedLocalRegional[index].concentration) {
          updatedLocalRegional[index].volume = calculateVolume(
            updatedLocalRegional[index].anticipatedDose,
            updatedLocalRegional[index].concentration
          );
        }
      } catch (e) {
        console.error('Error calculating anticipated dose for local regional:', e);
      }
    }
    
    // Auto-calculate volume if anticipated dose or concentration changes
    if ((field === 'anticipatedDose' || field === 'concentration') && 
        updatedLocalRegional[index].anticipatedDose && 
        updatedLocalRegional[index].concentration) {
      try {
        updatedLocalRegional[index].volume = calculateVolume(
          updatedLocalRegional[index].anticipatedDose,
          updatedLocalRegional[index].concentration
        );
      } catch (e) {
        console.error('Error calculating volume for local regional:', e);
      }
    }
    
    setPlan(prev => ({ ...prev, localRegional: updatedLocalRegional }));
  };

  // Handle adding a emergency drug from the predefined list
  const handleAddEmergencyDrug = (drug: { name: string; dose: string; volume: string }) => {
    setPlan(prev => ({
      ...prev,
      emergencyDrugs: [
        ...prev.emergencyDrugs,
        drug
      ]
    }));
  };

  // Helper to handle monitoring equipment toggles
  const handleToggleIVC = (field: keyof AnesthesiaPlan['monitoringPlan']['ivcs']) => () => {
    setPlan(prev => ({
      ...prev,
      monitoringPlan: {
        ...prev.monitoringPlan,
        ivcs: {
          ...prev.monitoringPlan.ivcs,
          [field]: !prev.monitoringPlan.ivcs[field]
        }
      }
    }));
  };
  
  // Toggle IV Catheter in place
  const handleToggleIVCatheter = () => {
    setPlan(prev => ({
      ...prev,
      ivCatheterInPlace: !prev.ivCatheterInPlace
    }));
  };
  
  // Toggle monitoring equipment
  const handleToggleMonitoringEquipment = (field: keyof Omit<AnesthesiaPlan['monitoringPlan'], 'ivcs'>) => () => {
    setPlan(prev => ({
      ...prev,
      monitoringPlan: {
        ...prev.monitoringPlan,
        [field]: !prev.monitoringPlan[field]
      }
    }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {/* Premedications Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Premedication</Typography>
          <Button 
            startIcon={<AddCircleOutlineIcon />}
            onClick={addPremedication}
            size="small"
          >
            Add
          </Button>
        </Box>
        
        {plan.premedications.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No premedications added yet.</Typography>
        ) : (
          plan.premedications.map((med, index) => {
            const inputId = getInputId('premedication', index);
            
            return (
              <Box 
                key={`premedication-${index}`} 
                sx={{ 
                  mb: 2, 
                  pb: 2, 
                  borderBottom: index !== plan.premedications.length - 1 ? `1px solid ${alpha('#000', 0.1)}` : 'none'
                }}
              >
                <MuiGrid container spacing={2}>
                  <MuiGrid item xs={12} md={4}>
                      <div ref={(el) => assignRef(inputId, el)} style={{ position: 'relative', width: '100%' }}>
                    <TextField
                      fullWidth
                      label="Medication Name"
                      value={med.name}
                      onChange={(e) => {
                        updatePremedication(index, 'name', e.target.value);
                        handleDrugSearch('premedication', index, e.target.value);
                      }}
                      size="small"
                      variant="outlined"
                      required
                      InputProps={{
                        endAdornment: isLoadingDrugs ? (
                          <InputAdornment position="end">
                            <CircularProgress size={20} />
                          </InputAdornment>
                        ) : null
                      }}
                    />
                    {dropdownOpen[inputId] && filteredDrugs[inputId]?.length > 0 && (
                      <ClickAwayListener onClickAway={() => handleClickAway(inputId)}>
                        <MuiPaper sx={{ 
                          position: 'absolute', 
                          zIndex: 1000, 
                          mt: 0.5, 
                          width: '100%',
                          maxHeight: '200px',
                          overflowY: 'auto'
                        }}>
                          <List dense>
                            {filteredDrugs[inputId].map((drug) => (
                              <ListItem 
                                key={drug.id} 
                                onClick={() => handleDrugSelect('premedication', index, drug.name)}
                                button={true}
                              >
                                <ListItemText primary={drug.name} />
                              </ListItem>
                            ))}
                          </List>
                        </MuiPaper>
                      </ClickAwayListener>
                    )}
                      </div>
                  </MuiGrid>
                  <MuiGrid item xs={12} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel id={`route-label-premed-${index}`}>Route</InputLabel>
                      <Select
                        labelId={`route-label-premed-${index}`}
                        value={med.route}
                        onChange={(e) => updatePremedication(index, 'route', e.target.value)}
                        label="Route"
                      >
                        <MenuItem value="IV">IV</MenuItem>
                        <MenuItem value="IM">IM</MenuItem>
                        <MenuItem value="SQ">SQ</MenuItem>
                        <MenuItem value="PO">PO</MenuItem>
                      </Select>
                    </FormControl>
                  </MuiGrid>
                  <MuiGrid item xs={12} md={2}>
                    <TextField
                      fullWidth
                        label="Dosage mg/kg"
                      value={med.dosageRange}
                      onChange={(e) => updatePremedication(index, 'dosageRange', e.target.value)}
                      size="small"
                      variant="outlined"
                        InputLabelProps={{ shrink: true }}
                    />
                  </MuiGrid>
                  <MuiGrid item xs={12} md={2}>
                    <TextField
                      fullWidth
                        label="Anticipated Dose mg"
                      value={med.anticipatedDose}
                      onChange={(e) => updatePremedication(index, 'anticipatedDose', e.target.value)}
                      size="small"
                      variant="outlined"
                        InputLabelProps={{ shrink: true }}
                    />
                  </MuiGrid>
                  <MuiGrid item xs={6} md={1}>
                    <TextField
                      fullWidth
                        label="Conc. mg/ml"
                      value={med.concentration}
                      onChange={(e) => updatePremedication(index, 'concentration', e.target.value)}
                      size="small"
                      variant="outlined"
                        InputLabelProps={{ shrink: true }}
                    />
                  </MuiGrid>
                  <MuiGrid item xs={6} md={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                      <TextField
                        fullWidth
                          label="Volume ml"
                        value={med.volume}
                        onChange={(e) => updatePremedication(index, 'volume', e.target.value)}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 1 }}
                          InputLabelProps={{ shrink: true }}
                      />
                      <IconButton 
                        onClick={() => removePremedication(index)}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </MuiGrid>
                </MuiGrid>
              </Box>
            );
          })
        )}
      </Paper>
      
      {/* Induction Agents Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Induction Agents</Typography>
          <Button 
            startIcon={<AddCircleOutlineIcon />}
            onClick={addInductionAgent}
            size="small"
          >
            Add
          </Button>
        </Box>
        
        {plan.inductionAgents.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No induction agents added yet.</Typography>
        ) : (
          plan.inductionAgents.map((med, index) => {
            const inputId = getInputId('induction', index);
            
            return (
              <Box 
                key={`induction-${index}`} 
                sx={{ 
                  mb: 2, 
                  pb: 2, 
                  borderBottom: index !== plan.inductionAgents.length - 1 ? `1px solid ${alpha('#000', 0.1)}` : 'none'
                }}
              >
                <MuiGrid container spacing={2}>
                  <MuiGrid item xs={12} md={4}>
                      <div ref={(el) => assignRef(inputId, el)} style={{ position: 'relative', width: '100%' }}>
                    <TextField
                      fullWidth
                      label="Medication Name"
                      value={med.name}
                      onChange={(e) => {
                        updateInductionAgent(index, 'name', e.target.value);
                        handleDrugSearch('induction', index, e.target.value);
                      }}
                      size="small"
                      variant="outlined"
                      required
                      InputProps={{
                        endAdornment: isLoadingDrugs ? (
                          <InputAdornment position="end">
                            <CircularProgress size={20} />
                          </InputAdornment>
                        ) : null
                      }}
                    />
                    {dropdownOpen[inputId] && filteredDrugs[inputId]?.length > 0 && (
                      <ClickAwayListener onClickAway={() => handleClickAway(inputId)}>
                        <MuiPaper sx={{ 
                          position: 'absolute', 
                          zIndex: 1000, 
                          mt: 0.5, 
                          width: '100%',
                          maxHeight: '200px',
                          overflowY: 'auto'
                        }}>
                          <List dense>
                            {filteredDrugs[inputId].map((drug) => (
                              <ListItem 
                                key={drug.id} 
                                onClick={() => handleDrugSelect('induction', index, drug.name)}
                                button={true}
                              >
                                <ListItemText primary={drug.name} />
                              </ListItem>
                            ))}
                          </List>
                        </MuiPaper>
                      </ClickAwayListener>
                    )}
                      </div>
                  </MuiGrid>
                  <MuiGrid item xs={12} md={2}>
                    <FormControl fullWidth size="small">
                        <InputLabel id={`route-label-induction-${index}`}>Route</InputLabel>
                      <Select
                        labelId={`route-label-induction-${index}`}
                        value={med.route}
                        onChange={(e) => updateInductionAgent(index, 'route', e.target.value)}
                        label="Route"
                      >
                        <MenuItem value="IV">IV</MenuItem>
                        <MenuItem value="IM">IM</MenuItem>
                        <MenuItem value="SQ">SQ</MenuItem>
                        <MenuItem value="PO">PO</MenuItem>
                      </Select>
                    </FormControl>
                  </MuiGrid>
                  <MuiGrid item xs={12} md={2}>
                    <TextField
                      fullWidth
                        label="Dosage mg/kg"
                      value={med.dosageRange}
                      onChange={(e) => updateInductionAgent(index, 'dosageRange', e.target.value)}
                      size="small"
                      variant="outlined"
                        InputLabelProps={{ shrink: true }}
                    />
                  </MuiGrid>
                  <MuiGrid item xs={12} md={2}>
                    <TextField
                      fullWidth
                        label="Anticipated Dose mg"
                      value={med.anticipatedDose}
                      onChange={(e) => updateInductionAgent(index, 'anticipatedDose', e.target.value)}
                      size="small"
                      variant="outlined"
                        InputLabelProps={{ shrink: true }}
                    />
                  </MuiGrid>
                  <MuiGrid item xs={6} md={1}>
                    <TextField
                      fullWidth
                        label="Conc. mg/ml"
                      value={med.concentration || ''}
                      onChange={(e) => updateInductionAgent(index, 'concentration', e.target.value)}
                      size="small"
                      variant="outlined"
                        InputLabelProps={{ shrink: true }}
                    />
                  </MuiGrid>
                  <MuiGrid item xs={6} md={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                      <TextField
                        fullWidth
                          label="Volume ml"
                        value={med.volume || ''}
                        onChange={(e) => updateInductionAgent(index, 'volume', e.target.value)}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 1 }}
                          InputLabelProps={{ shrink: true }}
                      />
                      <IconButton 
                        onClick={() => removeInductionAgent(index)}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </MuiGrid>
                </MuiGrid>
              </Box>
            );
          })
        )}
      </Paper>
      
      {/* Moved: Maintenance Section (moved up) */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Maintenance</Typography>
        <FormControl component="fieldset" error={!!errors.maintenance}>
          <Typography variant="subtitle2" gutterBottom>Maintenance Type</Typography>
          <RadioGroup
            row
            name="maintenanceType"
            value={plan.maintenance.includes('Inhalant') ? 'inhalant' : 'tiva'}
            onChange={(e) => {
              if (e.target.value === 'inhalant') {
                setPlan(prev => ({ ...prev, maintenance: 'Inhalant: Isoflurane' }));
              } else {
                setPlan(prev => ({ ...prev, maintenance: 'TIVA' }));
              }
            }}
          >
            <FormControlLabel value="inhalant" control={<Radio />} label="Inhalant" />
            <FormControlLabel value="tiva" control={<Radio />} label="TIVA" />
          </RadioGroup>
          
          {plan.maintenance.includes('Inhalant') && (
            <FormControl variant="outlined" size="small" sx={{ width: 200, mt: 1 }}>
              <InputLabel>Inhalant Type</InputLabel>
              <Select
                value={plan.maintenance.includes('Isoflurane') ? 'Isoflurane' : 'Sevoflurane'}
                onChange={(e) => {
                  setPlan(prev => ({ ...prev, maintenance: `Inhalant: ${e.target.value}` }));
                }}
                label="Inhalant Type"
              >
                <MenuItem value="Isoflurane">Isoflurane</MenuItem>
                <MenuItem value="Sevoflurane">Sevoflurane</MenuItem>
              </Select>
            </FormControl>
          )}
          
          {!!errors.maintenance && (
            <Typography color="error" variant="caption">{errors.maintenance}</Typography>
          )}
        </FormControl>
      </Paper>
      
      {/* IV Fluids Section - removed drops/sec field */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">IV Fluids</Typography>
          <Button 
            startIcon={<AddCircleOutlineIcon />}
            onClick={addIVFluid}
            size="small"
          >
            Add
          </Button>
        </Box>
        
        {plan.ivFluids.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No IV fluids added yet.</Typography>
        ) : (
          plan.ivFluids.map((fluid, index) => (
            <Box 
              key={`fluid-${index}`} 
              sx={{ 
                mb: 2, 
                pb: 2, 
                borderBottom: index !== plan.ivFluids.length - 1 ? `1px solid ${alpha('#000', 0.1)}` : 'none'
              }}
            >
              <MuiGrid container spacing={2}>
                <MuiGrid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Fluid Type</InputLabel>
                    <Select
                      value={fluid.name}
                      onChange={(e) => updateIVFluid(index, 'name', e.target.value)}
                      label="Fluid Type"
                    >
                      {COMMON_IV_FLUIDS.map((fluidType) => (
                        <MenuItem key={fluidType} value={fluidType}>
                          {fluidType}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </MuiGrid>
                <MuiGrid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Rate ml/kg/hr"
                    value={fluid.rate}
                    onChange={(e) => updateIVFluid(index, 'rate', e.target.value)}
                    size="small"
                    variant="outlined"
                  />
                </MuiGrid>
                <MuiGrid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Hour rate (ml/hr)"
                    value={fluid.mlPerHr}
                    onChange={(e) => updateIVFluid(index, 'mlPerHr', e.target.value)}
                    size="small"
                    variant="outlined"
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </MuiGrid>
                <MuiGrid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Additives"
                    value={fluid.additives || ''}
                    onChange={(e) => updateIVFluid(index, 'additives', e.target.value)}
                    size="small"
                    variant="outlined"
                    placeholder="e.g., KCl, B vitamins"
                  />
                </MuiGrid>
                <MuiGrid item xs={12} md={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <IconButton 
                    onClick={() => removeIVFluid(index)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </MuiGrid>
              </MuiGrid>
            </Box>
          ))
        )}
      </Paper>
      
      {/* CRIs Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Constant Rate Infusions (CRIs)</Typography>
          <Button 
            startIcon={<AddCircleOutlineIcon />}
            onClick={addCRI}
            size="small"
          >
            Add
          </Button>
        </Box>
        
        {plan.cris.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No CRIs added yet.</Typography>
        ) : (
          plan.cris.map((cri, index) => (
            <Box 
              key={`cri-${index}`} 
              sx={{ 
                mb: 2, 
                pb: 2, 
                borderBottom: index !== plan.cris.length - 1 ? `1px solid ${alpha('#000', 0.1)}` : 'none'
              }}
            >
              <MuiGrid container spacing={2}>
                <MuiGrid item xs={12} md={3}>
                  <div ref={(el) => assignRef(getInputId('cri', index), el)} style={{ position: 'relative', width: '100%' }}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={searchText[getInputId('cri', index)] || cri.name}
                      onChange={(e) => handleDrugSearch('cri', index, e.target.value)}
                      size="small"
                      variant="outlined"
                      required
                    />
                    {dropdownOpen[getInputId('cri', index)] && filteredDrugs[getInputId('cri', index)] && filteredDrugs[getInputId('cri', index)].length > 0 && (
                      <ClickAwayListener onClickAway={() => handleClickAway(getInputId('cri', index))}>
                        <Paper
                          sx={{
                            position: 'absolute',
                            width: '100%',
                            zIndex: 1000,
                            mt: 0.5,
                            maxHeight: '200px',
                            overflow: 'auto'
                          }}
                        >
                          <List dense>
                            {filteredDrugs[getInputId('cri', index)].map((drug) => (
                              <ListItem 
                                key={drug.id} 
                                onClick={() => handleDrugSelect('cri', index, drug.name)}
                                button={true}
                              >
                                <ListItemText primary={drug.name} />
                              </ListItem>
                            ))}
                          </List>
                        </Paper>
                      </ClickAwayListener>
                    )}
                  </div>
                </MuiGrid>
                <MuiGrid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Loading Dose"
                    value={cri.loadingDose || ''}
                    onChange={(e) => updateCRI(index, 'loadingDose', e.target.value)}
                    size="small"
                    variant="outlined"
                  />
                </MuiGrid>
                <MuiGrid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Dosage Range"
                    value={cri.dosageRange}
                    onChange={(e) => updateCRI(index, 'dosageRange', e.target.value)}
                    size="small"
                    variant="outlined"
                  />
                </MuiGrid>
                <MuiGrid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Concentration"
                    value={cri.concentration || ''}
                    onChange={(e) => updateCRI(index, 'concentration', e.target.value)}
                    size="small"
                    variant="outlined"
                  />
                </MuiGrid>
                <MuiGrid item xs={12} md={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <IconButton 
                    onClick={() => removeCRI(index)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </MuiGrid>
              </MuiGrid>
            </Box>
          ))
        )}
      </Paper>
      
      {/* Update Other Medications Section to match Premedication format */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Other Medications</Typography>
          <Button 
            startIcon={<AddCircleOutlineIcon />}
            onClick={addOtherTechnique}
            size="small"
          >
            Add
          </Button>
        </Box>
        
        {plan.otherTechniques.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No other medications added yet.</Typography>
        ) : (
          plan.otherTechniques.map((technique, index) => (
            <Box 
              key={`technique-${index}`} 
              sx={{ 
                mb: 2, 
                pb: 2, 
                borderBottom: index !== plan.otherTechniques.length - 1 ? `1px solid ${alpha('#000', 0.1)}` : 'none'
              }}
            >
              <MuiGrid container spacing={2}>
                <MuiGrid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Medication Name"
                    value={technique.name}
                    onChange={(e) => updateOtherTechnique(index, 'name', e.target.value)}
                    size="small"
                    variant="outlined"
                    required
                  />
                </MuiGrid>
                <MuiGrid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Dosage mg/kg"
                    value={technique.dosageRange || ''}
                    onChange={(e) => updateOtherTechnique(index, 'dosageRange', e.target.value)}
                    size="small"
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </MuiGrid>
                <MuiGrid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Anticipated Dose mg"
                    value={technique.anticipatedDose || ''}
                    onChange={(e) => updateOtherTechnique(index, 'anticipatedDose', e.target.value)}
                    size="small"
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </MuiGrid>
                <MuiGrid item xs={6} md={1}>
                  <TextField
                    fullWidth
                    label="Conc. mg/ml"
                    value={technique.concentration || ''}
                    onChange={(e) => updateOtherTechnique(index, 'concentration', e.target.value)}
                    size="small"
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </MuiGrid>
                <MuiGrid item xs={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <TextField
                      fullWidth
                      label="Volume ml"
                      value={technique.volume || ''}
                      onChange={(e) => updateOtherTechnique(index, 'volume', e.target.value)}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1 }}
                      InputLabelProps={{ shrink: true }}
                    />
                    <IconButton 
                      onClick={() => removeOtherTechnique(index)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </MuiGrid>
              </MuiGrid>
            </Box>
          ))
        )}
      </Paper>

      {/* Local Regional Anesthesia Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Local Regional Anesthesia</Typography>
          <Button 
            startIcon={<AddCircleOutlineIcon />}
            onClick={addLocalRegional}
            size="small"
          >
            Add
          </Button>
        </Box>
        
        {plan.localRegional && plan.localRegional.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No local regional anesthesia techniques added yet.</Typography>
        ) : (
          plan.localRegional && plan.localRegional.map((technique, index) => (
            // Local regional anesthesia technique card
            <Box
              key={`local-regional-${index}`}
              sx={{
                mb: 2,
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                position: 'relative'
              }}
            >
              {/* Content of local regional anesthesia box */}
              <MuiGrid container spacing={2}>
                <MuiGrid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Technique"
                    value={technique.technique}
                    onChange={(e) => handleSetLocalRegional(index, 'technique', e.target.value)}
                    size="small"
                    variant="outlined"
                    placeholder="e.g., Epidural, RUMM block"
                    required
                  />
                </MuiGrid>
                <MuiGrid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Local Anesthetic</InputLabel>
                    <Select
                      value={technique.name}
                      onChange={(e) => handleSetLocalRegional(index, 'name', e.target.value)}
                      label="Local Anesthetic"
                    >
                      {LOCAL_ANESTHETICS.map((drug) => (
                        <MenuItem key={drug} value={drug}>
                          {drug}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </MuiGrid>
                <MuiGrid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Dosage mg/kg"
                    value={technique.dosageRange || ''}
                    onChange={(e) => handleSetLocalRegional(index, 'dosageRange', e.target.value)}
                    size="small"
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </MuiGrid>
                <MuiGrid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Anticipated Dose mg"
                    value={technique.anticipatedDose || ''}
                    onChange={(e) => handleSetLocalRegional(index, 'anticipatedDose', e.target.value)}
                    size="small"
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </MuiGrid>
                <MuiGrid item xs={6} md={1}>
                  <TextField
                    fullWidth
                    label="Conc. mg/ml"
                    value={technique.concentration || ''}
                    onChange={(e) => handleSetLocalRegional(index, 'concentration', e.target.value)}
                    size="small"
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </MuiGrid>
                <MuiGrid item xs={6} md={1}>
                  <TextField
                    fullWidth
                    label="Volume ml"
                    value={technique.volume || ''}
                    onChange={(e) => handleSetLocalRegional(index, 'volume', e.target.value)}
                    size="small"
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </MuiGrid>
                <MuiGrid item xs={12} md={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TextField
                      fullWidth
                      label="Additives"
                      value={technique.additives || ''}
                      onChange={(e) => handleSetLocalRegional(index, 'additives', e.target.value)}
                      size="small"
                      variant="outlined"
                      placeholder="e.g., Morphine, Dexmedetomidine"
                      sx={{ mr: 1 }}
                    />
                    <IconButton 
                      onClick={() => removeLocalRegional(index)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </MuiGrid>
              </MuiGrid>
            </Box>
          ))
        )}
      </Paper>
      
      {/* Post-Operative Plan Section - Moved up */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Post-Operative Plan</Typography>
        
        <MuiGrid container spacing={3}>
          <MuiGrid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Post-Operative Plan"
              value={plan.postOpPlan || ''}
              onChange={handleTextChange('postOpPlan')}
              multiline
              rows={4}
              placeholder="Detailed post-operative care instructions, including pain management, monitoring requirements, etc."
            />
          </MuiGrid>
          
          <MuiGrid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>Recovery Area</Typography>
            <FormControl fullWidth size="small">
              <Select
                value={plan.recoveryArea}
                onChange={(e) => setPlan(prev => ({ 
                  ...prev, 
                  recoveryArea: e.target.value as any,
                  recoveryAreaOther: e.target.value === 'Other' ? prev.recoveryAreaOther : '' 
                }))}
              >
                <MenuItem value="Anesthesia">Anesthesia</MenuItem>
                <MenuItem value="ICU">ICU</MenuItem>
                <MenuItem value="Wards">Wards</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            
            {plan.recoveryArea === 'Other' && (
              <TextField
                fullWidth
                placeholder="Specify recovery area"
                value={plan.recoveryAreaOther || ''}
                onChange={(e) => setPlan(prev => ({ ...prev, recoveryAreaOther: e.target.value }))}
                size="small"
                sx={{ mt: 1 }}
              />
            )}
          </MuiGrid>
        </MuiGrid>
      </Paper>
      
      {/* Emergency Drugs and Reversals - Card Display */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Emergency Drugs and Reversals</Typography>
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: 2 
        }}>
          {EMERGENCY_DRUGS.map((drug, index) => (
            <EmergencyDrugCard 
              key={index}
              drugName={drug.name}
              dogDosage={drug.dogDosage}
              catDosage={drug.catDosage}
              concentration={drug.concentration}
              patientWeight={patientWeight}
              drugColor={drug.color}
              onAdd={handleAddEmergencyDrug}
            />
          ))}
        </Box>
      </Paper>
      
      {/* Monitoring Plan Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Monitoring Plan</Typography>
        
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>IV Catheters</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <ToggleButton
            value="shortTerm"
            selected={plan.monitoringPlan.ivcs.shortTerm}
            onChange={handleToggleIVC('shortTerm')}
            sx={{ 
              minWidth: '120px', 
              bgcolor: plan.monitoringPlan.ivcs.shortTerm ? 'primary.dark' : 'background.paper',
              color: plan.monitoringPlan.ivcs.shortTerm ? 'primary.contrastText' : 'text.primary',
              border: plan.monitoringPlan.ivcs.shortTerm ? '1px solid transparent' : '1px solid rgba(0, 0, 0, 0.23)',
              fontWeight: plan.monitoringPlan.ivcs.shortTerm ? 'bold' : 'normal',
              '&.Mui-selected': {
                bgcolor: 'primary.dark',
                color: 'primary.contrastText',
              },
              '&.Mui-selected:hover': {
                bgcolor: 'primary.dark',
                color: 'primary.contrastText'
              },
              '&:hover': {
                bgcolor: plan.monitoringPlan.ivcs.shortTerm ? 'primary.dark' : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            Short Term
          </ToggleButton>
          
          <ToggleButton
            value="longTerm"
            selected={plan.monitoringPlan.ivcs.longTerm}
            onChange={handleToggleIVC('longTerm')}
            sx={{ 
              minWidth: '120px', 
              bgcolor: plan.monitoringPlan.ivcs.longTerm ? 'primary.dark' : 'background.paper',
              color: plan.monitoringPlan.ivcs.longTerm ? 'primary.contrastText' : 'text.primary',
              border: plan.monitoringPlan.ivcs.longTerm ? '1px solid transparent' : '1px solid rgba(0, 0, 0, 0.23)',
              fontWeight: plan.monitoringPlan.ivcs.longTerm ? 'bold' : 'normal',
              '&.Mui-selected': {
                bgcolor: 'primary.dark',
                color: 'primary.contrastText',
              },
              '&.Mui-selected:hover': {
                bgcolor: 'primary.dark',
                color: 'primary.contrastText'
              },
              '&:hover': {
                bgcolor: plan.monitoringPlan.ivcs.longTerm ? 'primary.dark' : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            Long Term
          </ToggleButton>
          
          <ToggleButton
            value="secondIV"
            selected={plan.monitoringPlan.ivcs.secondIV}
            onChange={handleToggleIVC('secondIV')}
            sx={{ 
              minWidth: '120px', 
              bgcolor: plan.monitoringPlan.ivcs.secondIV ? 'primary.dark' : 'background.paper',
              color: plan.monitoringPlan.ivcs.secondIV ? 'primary.contrastText' : 'text.primary',
              border: plan.monitoringPlan.ivcs.secondIV ? '1px solid transparent' : '1px solid rgba(0, 0, 0, 0.23)',
              fontWeight: plan.monitoringPlan.ivcs.secondIV ? 'bold' : 'normal',
              '&.Mui-selected': {
                bgcolor: 'primary.dark',
                color: 'primary.contrastText',
              },
              '&.Mui-selected:hover': {
                bgcolor: 'primary.dark',
                color: 'primary.contrastText'
              },
              '&:hover': {
                bgcolor: plan.monitoringPlan.ivcs.secondIV ? 'primary.dark' : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            Second IV
          </ToggleButton>
          
          <ToggleButton
            value="ivCatheterInPlace"
            selected={plan.ivCatheterInPlace || false}
            onChange={handleToggleIVCatheter}
            sx={{ 
              minWidth: '180px', 
              bgcolor: plan.ivCatheterInPlace ? 'success.light' : 'background.paper',
              color: plan.ivCatheterInPlace ? 'success.contrastText' : 'text.primary',
              border: plan.ivCatheterInPlace ? '1px solid transparent' : '1px solid rgba(0, 0, 0, 0.23)',
              fontWeight: plan.ivCatheterInPlace ? 'bold' : 'normal',
              '&.Mui-selected': {
                bgcolor: 'success.light',
                color: 'success.contrastText',
              },
              '&.Mui-selected:hover': {
                bgcolor: 'success.light',
                color: 'success.contrastText'
              },
              '&:hover': {
                bgcolor: plan.ivCatheterInPlace ? 'success.light' : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            ✓ IV Catheter Already In Place
          </ToggleButton>
        </Box>
        
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Patient Monitoring</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          <ToggleButton
            value="spo2"
            selected={plan.monitoringPlan.spo2}
            onChange={handleToggleMonitoringEquipment('spo2')}
            sx={{ 
              minWidth: '120px', 
              bgcolor: plan.monitoringPlan.spo2 ? 'primary.dark' : 'background.paper',
              color: plan.monitoringPlan.spo2 ? 'primary.contrastText' : 'text.primary',
              border: plan.monitoringPlan.spo2 ? '1px solid transparent' : '1px solid rgba(0, 0, 0, 0.23)',
              fontWeight: plan.monitoringPlan.spo2 ? 'bold' : 'normal',
              '&.Mui-selected': {
                bgcolor: 'primary.dark',
                color: 'primary.contrastText',
              },
              '&.Mui-selected:hover': {
                bgcolor: 'primary.dark',
                color: 'primary.contrastText'
              },
              '&:hover': {
                bgcolor: plan.monitoringPlan.spo2 ? 'primary.dark' : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            SpO2
          </ToggleButton>
          
          <ToggleButton
            value="temp"
            selected={plan.monitoringPlan.temp}
            onChange={handleToggleMonitoringEquipment('temp')}
            sx={{ 
              minWidth: '120px', 
              bgcolor: plan.monitoringPlan.temp ? 'primary.dark' : 'background.paper',
              color: plan.monitoringPlan.temp ? 'primary.contrastText' : 'text.primary',
              border: plan.monitoringPlan.temp ? '1px solid transparent' : '1px solid rgba(0, 0, 0, 0.23)',
              fontWeight: plan.monitoringPlan.temp ? 'bold' : 'normal',
              '&.Mui-selected': {
                bgcolor: 'primary.dark',
                color: 'primary.contrastText',
              },
              '&.Mui-selected:hover': {
                bgcolor: 'primary.dark',
                color: 'primary.contrastText'
              },
              '&:hover': {
                bgcolor: plan.monitoringPlan.temp ? 'primary.dark' : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            Temp
          </ToggleButton>
          
          <ToggleButton
            value="ecg"
            selected={plan.monitoringPlan.ecg}
            onChange={handleToggleMonitoringEquipment('ecg')}
            sx={{ 
              minWidth: '120px', 
              bgcolor: plan.monitoringPlan.ecg ? 'primary.dark' : 'background.paper',
              color: plan.monitoringPlan.ecg ? 'primary.contrastText' : 'text.primary',
              border: plan.monitoringPlan.ecg ? '1px solid transparent' : '1px solid rgba(0, 0, 0, 0.23)',
              fontWeight: plan.monitoringPlan.ecg ? 'bold' : 'normal',
              '&.Mui-selected': {
                bgcolor: 'primary.dark',
                color: 'primary.contrastText',
              },
              '&.Mui-selected:hover': {
                bgcolor: 'primary.dark',
                color: 'primary.contrastText'
              },
              '&:hover': {
                bgcolor: plan.monitoringPlan.ecg ? 'primary.dark' : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            ECG
          </ToggleButton>
          
          <ToggleButton
            value="etco2"
            selected={plan.monitoringPlan.etco2}
            onChange={handleToggleMonitoringEquipment('etco2')}
            sx={{ 
              minWidth: '120px', 
              bgcolor: plan.monitoringPlan.etco2 ? 'primary.dark' : 'background.paper',
              color: plan.monitoringPlan.etco2 ? 'primary.contrastText' : 'text.primary',
              border: plan.monitoringPlan.etco2 ? '1px solid transparent' : '1px solid rgba(0, 0, 0, 0.23)',
              fontWeight: plan.monitoringPlan.etco2 ? 'bold' : 'normal',
              '&.Mui-selected': {
                bgcolor: 'primary.dark',
                color: 'primary.contrastText',
              },
              '&.Mui-selected:hover': {
                bgcolor: 'primary.dark',
                color: 'primary.contrastText'
              },
              '&:hover': {
                bgcolor: plan.monitoringPlan.etco2 ? 'primary.dark' : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            EtCO2
          </ToggleButton>
          
          <ToggleButton
            value="ibp"
            selected={plan.monitoringPlan.ibp}
            onChange={handleToggleMonitoringEquipment('ibp')}
            sx={{ 
              minWidth: '120px', 
              bgcolor: plan.monitoringPlan.ibp ? 'primary.dark' : 'background.paper',
              color: plan.monitoringPlan.ibp ? 'primary.contrastText' : 'text.primary',
              border: plan.monitoringPlan.ibp ? '1px solid transparent' : '1px solid rgba(0, 0, 0, 0.23)',
              fontWeight: plan.monitoringPlan.ibp ? 'bold' : 'normal',
              '&.Mui-selected': {
                bgcolor: 'primary.dark',
                color: 'primary.contrastText',
              },
              '&.Mui-selected:hover': {
                bgcolor: 'primary.dark',
                color: 'primary.contrastText'
              },
              '&:hover': {
                bgcolor: plan.monitoringPlan.ibp ? 'primary.dark' : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            IBP
          </ToggleButton>
          
          <ToggleButton
            value="nibp"
            selected={plan.monitoringPlan.nibp}
            onChange={handleToggleMonitoringEquipment('nibp')}
            sx={{ 
              minWidth: '120px', 
              bgcolor: plan.monitoringPlan.nibp ? 'primary.dark' : 'background.paper',
              color: plan.monitoringPlan.nibp ? 'primary.contrastText' : 'text.primary',
              border: plan.monitoringPlan.nibp ? '1px solid transparent' : '1px solid rgba(0, 0, 0, 0.23)',
              fontWeight: plan.monitoringPlan.nibp ? 'bold' : 'normal',
              '&.Mui-selected': {
                bgcolor: 'primary.dark',
                color: 'primary.contrastText',
              },
              '&.Mui-selected:hover': {
                bgcolor: 'primary.dark',
                color: 'primary.contrastText'
              },
              '&:hover': {
                bgcolor: plan.monitoringPlan.nibp ? 'primary.dark' : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            NIBP
          </ToggleButton>
          
          <ToggleButton
            value="doppler"
            selected={plan.monitoringPlan.doppler}
            onChange={handleToggleMonitoringEquipment('doppler')}
            sx={{ 
              minWidth: '120px', 
              bgcolor: plan.monitoringPlan.doppler ? 'primary.dark' : 'background.paper',
              color: plan.monitoringPlan.doppler ? 'primary.contrastText' : 'text.primary',
              border: plan.monitoringPlan.doppler ? '1px solid transparent' : '1px solid rgba(0, 0, 0, 0.23)',
              fontWeight: plan.monitoringPlan.doppler ? 'bold' : 'normal',
              '&.Mui-selected': {
                bgcolor: 'primary.dark',
                color: 'primary.contrastText',
              },
              '&.Mui-selected:hover': {
                bgcolor: 'primary.dark',
                color: 'primary.contrastText'
              },
              '&:hover': {
                bgcolor: plan.monitoringPlan.doppler ? 'primary.dark' : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            Doppler
          </ToggleButton>
          
          <ToggleButton
            value="arterialLine"
            selected={plan.monitoringPlan.arterialLine}
            onChange={handleToggleMonitoringEquipment('arterialLine')}
            sx={{ 
              minWidth: '120px', 
              bgcolor: plan.monitoringPlan.arterialLine ? 'primary.dark' : 'background.paper',
              color: plan.monitoringPlan.arterialLine ? 'primary.contrastText' : 'text.primary',
              border: plan.monitoringPlan.arterialLine ? '1px solid transparent' : '1px solid rgba(0, 0, 0, 0.23)',
              fontWeight: plan.monitoringPlan.arterialLine ? 'bold' : 'normal',
              '&.Mui-selected': {
                bgcolor: 'primary.dark',
                color: 'primary.contrastText',
              },
              '&.Mui-selected:hover': {
                bgcolor: 'primary.dark',
                color: 'primary.contrastText'
              },
              '&:hover': {
                bgcolor: plan.monitoringPlan.arterialLine ? 'primary.dark' : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            Arterial Line
          </ToggleButton>
          
          <ToggleButton
            value="centralLine"
            selected={plan.monitoringPlan.centralLine}
            onChange={handleToggleMonitoringEquipment('centralLine')}
            sx={{ 
              minWidth: '120px', 
              bgcolor: plan.monitoringPlan.centralLine ? 'primary.dark' : 'background.paper',
              color: plan.monitoringPlan.centralLine ? 'primary.contrastText' : 'text.primary',
              border: plan.monitoringPlan.centralLine ? '1px solid transparent' : '1px solid rgba(0, 0, 0, 0.23)',
              fontWeight: plan.monitoringPlan.centralLine ? 'bold' : 'normal',
              '&.Mui-selected': {
                bgcolor: 'primary.dark',
                color: 'primary.contrastText',
              },
              '&.Mui-selected:hover': {
                bgcolor: 'primary.dark',
                color: 'primary.contrastText'
              },
              '&:hover': {
                bgcolor: plan.monitoringPlan.centralLine ? 'primary.dark' : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            Central Line
          </ToggleButton>
        </Box>
        
        {/* Additional Equipment section */}
        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Additional Equipment</Typography>
        <Box sx={{ mb: 2 }}>
          <MuiGrid container spacing={2}>
            <MuiGrid item xs={12} md={6}>
              <Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={plan.ventilator}
                      onChange={(e) => setPlan(prev => ({ ...prev, ventilator: e.target.checked }))}
                    />
                  }
                  label="Ventilator"
                />
                
                {plan.ventilator && (
                  <Box sx={{ mt: 1, pl: 4 }}>
                    <Typography variant="subtitle2" gutterBottom>Ventilator Settings</Typography>
                    <MuiGrid container spacing={2}>
                      <MuiGrid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Tidal Volume"
                          value={plan.tidalVolume || ''}
                          onChange={(e) => setPlan(prev => ({ ...prev, tidalVolume: e.target.value }))}
                          size="small"
                          InputProps={{
                            endAdornment: <InputAdornment position="end">ml</InputAdornment>,
                          }}
                        />
                      </MuiGrid>
                      <MuiGrid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Resp Rate"
                          value={plan.respRate || ''}
                          onChange={(e) => setPlan(prev => ({ ...prev, respRate: e.target.value }))}
                          size="small"
                          InputProps={{
                            endAdornment: <InputAdornment position="end">bpm</InputAdornment>,
                          }}
                        />
                      </MuiGrid>
                      <MuiGrid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="PEEP"
                          value={plan.peep || ''}
                          onChange={(e) => setPlan(prev => ({ ...prev, peep: e.target.value }))}
                          size="small"
                          InputProps={{
                            endAdornment: <InputAdornment position="end">cmH₂O</InputAdornment>,
                          }}
                        />
                      </MuiGrid>
                    </MuiGrid>
                  </Box>
                )}
              </Box>
            </MuiGrid>
            
            <MuiGrid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={plan.nmbMonitoring || false}
                    onChange={(e) => setPlan(prev => ({ ...prev, nmbMonitoring: e.target.checked }))}
                  />
                }
                label="NMB Monitoring"
              />
            </MuiGrid>
          </MuiGrid>
        </Box>
        
        {/* Total Blood Volume calculation */}
        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Blood Volume Estimation</Typography>
        <Box sx={{ mb: 2 }}>
          <MuiGrid container spacing={2}>
            <MuiGrid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Total Blood Volume"
                value={plan.totalBloodVolume}
                onChange={(e) => setPlan(prev => ({ ...prev, totalBloodVolume: e.target.value }))}
                variant="outlined"
                size="small"
                InputProps={{
                  endAdornment: <InputAdornment position="end">ml</InputAdornment>,
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Calculated at 90ml/kg for dogs and 60ml/kg for cats based on patient weight
              </Typography>
            </MuiGrid>
          </MuiGrid>
        </Box>
      </Paper>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={isLoading}
          sx={{ minWidth: 120 }}
        >
          {isLoading ? 'Saving...' : 'Save Plan'}
        </Button>
      </Box>
    </Box>
  );
};

export default AnesthesiaPlanForm; 