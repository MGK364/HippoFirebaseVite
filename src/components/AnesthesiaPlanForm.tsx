import React, { useState, useEffect } from 'react';
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
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { AnesthesiaPlan } from '../types';

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
}

interface CRIItem {
  name: string;
  loadingDose?: string;
  dosageRange: string;
  concentration?: string;
}

interface OtherTechniqueItem {
  name: string;
  drugs: string[];
  dosage: string;
  concentration?: string;
  volume?: string;
}

interface EmergencyDrugItem {
  name: string;
  dose: string;
  volume?: string;
}

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
  bolusVolume: ''
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
  concentration: '',
  volume: ''
};

const DEFAULT_EMERGENCY_DRUG: EmergencyDrugItem = {
  name: '',
  dose: '',
  volume: ''
};

const ROUTE_OPTIONS = ['IV', 'IM', 'SQ', 'PO', 'Inhalant', 'Topical', 'Other'];
const RECOVERY_AREAS = ['Anesthesia', 'ICU', 'Outpatient', 'Overnight', 'Other'];

const AnesthesiaPlanForm: React.FC<AnesthesiaPlanFormProps> = ({ 
  initialPlan, 
  onSave, 
  patientWeight,
  isLoading = false 
}) => {
  const [plan, setPlan] = useState<Omit<AnesthesiaPlan, 'id'>>(initialPlan);
  
  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Reset form when initialPlan changes
  useEffect(() => {
    setPlan(initialPlan);
  }, [initialPlan]);

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

  // Update premedication
  const updatePremedication = (index: number, field: keyof PremedicationItem, value: string) => {
    setPlan(prev => {
      const updatedItems = [...prev.premedications];
      updatedItems[index] = { 
        ...updatedItems[index], 
        [field]: value 
      };
      return { ...prev, premedications: updatedItems };
    });
  };

  // Update induction agent
  const updateInductionAgent = (index: number, field: keyof InductionAgentItem, value: string) => {
    setPlan(prev => {
      const updatedItems = [...prev.inductionAgents];
      updatedItems[index] = { 
        ...updatedItems[index], 
        [field]: value 
      };
      return { ...prev, inductionAgents: updatedItems };
    });
  };

  // Update IV fluid
  const updateIVFluid = (index: number, field: keyof IVFluidItem, value: string) => {
    setPlan(prev => {
      const updatedItems = [...prev.ivFluids];
      updatedItems[index] = { 
        ...updatedItems[index], 
        [field]: value 
      };
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
      updatedItems[index] = { 
        ...updatedItems[index], 
        [field]: value 
      };
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
      return { ...prev, emergencyDrugs: updatedItems };
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

  const removeEmergencyDrug = (index: number) => {
    setPlan(prev => {
      const updatedItems = [...prev.emergencyDrugs];
      updatedItems.splice(index, 1);
      return { ...prev, emergencyDrugs: updatedItems };
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

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {/* Premedications Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Premedications</Typography>
          <Button 
            startIcon={<AddCircleOutlineIcon />}
            onClick={addPremedication}
            size="small"
          >
            Add
          </Button>
        </Box>
        
        {errors.premedications && (
          <Typography color="error" variant="caption" sx={{ mb: 2, display: 'block' }}>
            {errors.premedications}
          </Typography>
        )}
        
        {plan.premedications.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No premedications added yet. Click "Add" to include a premedication.
          </Typography>
        ) : (
          plan.premedications.map((med, index) => (
            <Box 
              key={index} 
              sx={{ 
                mb: 2, 
                p: 1, 
                border: '1px solid', 
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper'
              }}
            >
              <MuiGrid container spacing={2}>
                <MuiGrid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={med.name}
                    onChange={(e) => updatePremedication(index, 'name', e.target.value)}
                    size="small"
                    variant="outlined"
                    required
                  />
                </MuiGrid>
                <MuiGrid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel id={`route-label-premed-${index}`}>Route</InputLabel>
                    <Select
                      labelId={`route-label-premed-${index}`}
                      value={med.route}
                      label="Route"
                      onChange={(e) => updatePremedication(index, 'route', e.target.value as string)}
                    >
                      {ROUTE_OPTIONS.map(option => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </MuiGrid>
                <MuiGrid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Dosage Range"
                    placeholder="mg/kg"
                    value={med.dosageRange}
                    onChange={(e) => updatePremedication(index, 'dosageRange', e.target.value)}
                    size="small"
                    variant="outlined"
                  />
                </MuiGrid>
                <MuiGrid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Anticipated Dose"
                    placeholder="mg"
                    value={med.anticipatedDose}
                    onChange={(e) => updatePremedication(index, 'anticipatedDose', e.target.value)}
                    size="small"
                    variant="outlined"
                  />
                </MuiGrid>
                <MuiGrid item xs={6} md={1}>
                  <TextField
                    fullWidth
                    label="Conc."
                    placeholder="mg/ml"
                    value={med.concentration}
                    onChange={(e) => updatePremedication(index, 'concentration', e.target.value)}
                    size="small"
                    variant="outlined"
                  />
                </MuiGrid>
                <MuiGrid item xs={6} md={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <TextField
                      fullWidth
                      label="Volume"
                      placeholder="ml"
                      value={med.volume}
                      onChange={(e) => updatePremedication(index, 'volume', e.target.value)}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1 }}
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
          ))
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
        
        {errors.inductionAgents && (
          <Typography color="error" variant="caption" sx={{ mb: 2, display: 'block' }}>
            {errors.inductionAgents}
          </Typography>
        )}
        
        {plan.inductionAgents.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No induction agents added yet. Click "Add" to include an induction agent.
          </Typography>
        ) : (
          plan.inductionAgents.map((med, index) => (
            <Box 
              key={index} 
              sx={{ 
                mb: 2, 
                p: 1, 
                border: '1px solid', 
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper'
              }}
            >
              <MuiGrid container spacing={2}>
                <MuiGrid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={med.name}
                    onChange={(e) => updateInductionAgent(index, 'name', e.target.value)}
                    size="small"
                    variant="outlined"
                    required
                  />
                </MuiGrid>
                <MuiGrid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel id={`route-label-induct-${index}`}>Route</InputLabel>
                    <Select
                      labelId={`route-label-induct-${index}`}
                      value={med.route}
                      label="Route"
                      onChange={(e) => updateInductionAgent(index, 'route', e.target.value as string)}
                    >
                      {ROUTE_OPTIONS.map(option => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </MuiGrid>
                <MuiGrid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Dosage Range"
                    placeholder="mg/kg"
                    value={med.dosageRange}
                    onChange={(e) => updateInductionAgent(index, 'dosageRange', e.target.value)}
                    size="small"
                    variant="outlined"
                  />
                </MuiGrid>
                <MuiGrid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Anticipated Dose"
                    placeholder="mg"
                    value={med.anticipatedDose}
                    onChange={(e) => updateInductionAgent(index, 'anticipatedDose', e.target.value)}
                    size="small"
                    variant="outlined"
                  />
                </MuiGrid>
                <MuiGrid item xs={6} md={1}>
                  <TextField
                    fullWidth
                    label="Conc."
                    placeholder="mg/ml"
                    value={med.concentration || ''}
                    onChange={(e) => updateInductionAgent(index, 'concentration', e.target.value)}
                    size="small"
                    variant="outlined"
                  />
                </MuiGrid>
                <MuiGrid item xs={6} md={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <TextField
                      fullWidth
                      label="Volume"
                      placeholder="ml"
                      value={med.volume || ''}
                      onChange={(e) => updateInductionAgent(index, 'volume', e.target.value)}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1 }}
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
          ))
        )}
      </Paper>
      
      {/* Maintenance Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Maintenance</Typography>
        <TextField
          fullWidth
          label="Maintenance Anesthesia"
          value={plan.maintenance}
          onChange={handleTextChange('maintenance')}
          error={!!errors.maintenance}
          helperText={errors.maintenance || "e.g., Isoflurane 1.5-2% in oxygen"}
          placeholder="E.g., Isoflurane 1.5-2% in oxygen"
        />
      </Paper>
      
      {/* IV Fluids Section */}
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No IV fluids added yet. Click "Add" to include IV fluids.
          </Typography>
        ) : (
          plan.ivFluids.map((fluid, index) => (
            <Box 
              key={index} 
              sx={{ 
                mb: 2, 
                p: 1, 
                border: '1px solid', 
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper'
              }}
            >
              <MuiGrid container spacing={2}>
                <MuiGrid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={fluid.name}
                    onChange={(e) => updateIVFluid(index, 'name', e.target.value)}
                    size="small"
                    variant="outlined"
                    required
                  />
                </MuiGrid>
                <MuiGrid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Rate"
                    placeholder="ml/kg/hr"
                    value={fluid.rate}
                    onChange={(e) => updateIVFluid(index, 'rate', e.target.value)}
                    size="small"
                    variant="outlined"
                  />
                </MuiGrid>
                <MuiGrid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="ml/hr"
                    value={fluid.mlPerHr}
                    onChange={(e) => updateIVFluid(index, 'mlPerHr', e.target.value)}
                    size="small"
                    variant="outlined"
                  />
                </MuiGrid>
                <MuiGrid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Drops/sec"
                    value={fluid.dropsPerSec || ''}
                    onChange={(e) => updateIVFluid(index, 'dropsPerSec', e.target.value)}
                    size="small"
                    variant="outlined"
                  />
                </MuiGrid>
                <MuiGrid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Bolus Volume"
                    value={fluid.bolusVolume || ''}
                    onChange={(e) => updateIVFluid(index, 'bolusVolume', e.target.value)}
                    size="small"
                    variant="outlined"
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No CRIs added yet. Click "Add" to include constant rate infusions.
          </Typography>
        ) : (
          plan.cris.map((cri, index) => (
            <Box 
              key={index} 
              sx={{ 
                mb: 2, 
                p: 1, 
                border: '1px solid', 
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper'
              }}
            >
              <MuiGrid container spacing={2}>
                <MuiGrid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={cri.name}
                    onChange={(e) => updateCRI(index, 'name', e.target.value)}
                    size="small"
                    variant="outlined"
                    required
                  />
                </MuiGrid>
                <MuiGrid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Loading Dose"
                    placeholder="mg/kg"
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
                    placeholder="mcg/kg/min"
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
                    placeholder="mg/ml"
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
      
      {/* Other Techniques Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Other Techniques</Typography>
          <Button 
            startIcon={<AddCircleOutlineIcon />}
            onClick={addOtherTechnique}
            size="small"
          >
            Add
          </Button>
        </Box>
        
        {plan.otherTechniques.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No other techniques added yet. Click "Add" to include other anesthetic techniques.
          </Typography>
        ) : (
          plan.otherTechniques.map((technique, index) => (
            <Box 
              key={index} 
              sx={{ 
                mb: 2, 
                p: 1, 
                border: '1px solid', 
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper'
              }}
            >
              <MuiGrid container spacing={2}>
                <MuiGrid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Technique Name"
                    placeholder="e.g., Epidural"
                    value={technique.name}
                    onChange={(e) => updateOtherTechnique(index, 'name', e.target.value)}
                    size="small"
                    variant="outlined"
                    required
                  />
                </MuiGrid>
                <MuiGrid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Drugs Used"
                    placeholder="e.g., Morphine, Bupivacaine"
                    value={technique.drugs.join(', ')}
                    onChange={(e) => updateOtherTechnique(
                      index, 
                      'drugs', 
                      e.target.value.split(',').map(drug => drug.trim())
                    )}
                    size="small"
                    variant="outlined"
                  />
                </MuiGrid>
                <MuiGrid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Dosage"
                    placeholder="e.g., 0.1 mg/kg"
                    value={technique.dosage}
                    onChange={(e) => updateOtherTechnique(index, 'dosage', e.target.value)}
                    size="small"
                    variant="outlined"
                  />
                </MuiGrid>
                <MuiGrid item xs={6} md={1}>
                  <TextField
                    fullWidth
                    label="Conc."
                    placeholder="mg/ml"
                    value={technique.concentration || ''}
                    onChange={(e) => updateOtherTechnique(index, 'concentration', e.target.value)}
                    size="small"
                    variant="outlined"
                  />
                </MuiGrid>
                <MuiGrid item xs={6} md={1}>
                  <TextField
                    fullWidth
                    label="Volume"
                    placeholder="ml"
                    value={technique.volume || ''}
                    onChange={(e) => updateOtherTechnique(index, 'volume', e.target.value)}
                    size="small"
                    variant="outlined"
                  />
                </MuiGrid>
                <MuiGrid item xs={12} md={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <IconButton 
                    onClick={() => removeOtherTechnique(index)}
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
      
      {/* Emergency Drugs Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Emergency Drugs</Typography>
          <Button 
            startIcon={<AddCircleOutlineIcon />}
            onClick={addEmergencyDrug}
            size="small"
          >
            Add
          </Button>
        </Box>
        
        {plan.emergencyDrugs.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No emergency drugs added yet. Click "Add" to include emergency drugs.
          </Typography>
        ) : (
          plan.emergencyDrugs.map((drug, index) => (
            <Box 
              key={index} 
              sx={{ 
                mb: 2, 
                p: 1, 
                border: '1px solid', 
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper'
              }}
            >
              <MuiGrid container spacing={2}>
                <MuiGrid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={drug.name}
                    onChange={(e) => updateEmergencyDrug(index, 'name', e.target.value)}
                    size="small"
                    variant="outlined"
                    required
                  />
                </MuiGrid>
                <MuiGrid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Dose"
                    placeholder="mg/kg"
                    value={drug.dose}
                    onChange={(e) => updateEmergencyDrug(index, 'dose', e.target.value)}
                    size="small"
                    variant="outlined"
                  />
                </MuiGrid>
                <MuiGrid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Volume"
                    placeholder="ml"
                    value={drug.volume || ''}
                    onChange={(e) => updateEmergencyDrug(index, 'volume', e.target.value)}
                    size="small"
                    variant="outlined"
                  />
                </MuiGrid>
                <MuiGrid item xs={12} md={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <IconButton 
                    onClick={() => removeEmergencyDrug(index)}
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
      
      {/* Monitoring Plan Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Monitoring Plan</Typography>
        
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>IV Catheters</Typography>
        <MuiGrid container spacing={2}>
          <MuiGrid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={plan.monitoringPlan.ivcs.peripheral} 
                  onChange={handleIVCChange('peripheral')}
                />
              }
              label="Peripheral"
            />
          </MuiGrid>
          <MuiGrid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={plan.monitoringPlan.ivcs.central} 
                  onChange={handleIVCChange('central')}
                />
              }
              label="Central"
            />
          </MuiGrid>
          <MuiGrid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={plan.monitoringPlan.ivcs.jugular} 
                  onChange={handleIVCChange('jugular')}
                />
              }
              label="Jugular"
            />
          </MuiGrid>
        </MuiGrid>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Monitoring Equipment</Typography>
        <MuiGrid container spacing={2}>
          <MuiGrid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={plan.monitoringPlan.ecg} 
                  onChange={handleMonitoringChange('ecg')}
                />
              }
              label="ECG"
            />
          </MuiGrid>
          <MuiGrid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={plan.monitoringPlan.directBP} 
                  onChange={handleMonitoringChange('directBP')}
                />
              }
              label="Direct BP"
            />
          </MuiGrid>
          <MuiGrid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={plan.monitoringPlan.indirectBP} 
                  onChange={handleMonitoringChange('indirectBP')}
                />
              }
              label="Indirect BP"
            />
          </MuiGrid>
          <MuiGrid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={plan.monitoringPlan.pulseOx} 
                  onChange={handleMonitoringChange('pulseOx')}
                />
              }
              label="Pulse Oximetry"
            />
          </MuiGrid>
          <MuiGrid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={plan.monitoringPlan.capnography} 
                  onChange={handleMonitoringChange('capnography')}
                />
              }
              label="Capnography"
            />
          </MuiGrid>
          <MuiGrid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={plan.monitoringPlan.tempProbe} 
                  onChange={handleMonitoringChange('tempProbe')}
                />
              }
              label="Temperature Probe"
            />
          </MuiGrid>
          <MuiGrid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={plan.monitoringPlan.doppler} 
                  onChange={handleMonitoringChange('doppler')}
                />
              }
              label="Doppler"
            />
          </MuiGrid>
        </MuiGrid>
        
        <TextField
          fullWidth
          label="Other Monitoring Notes"
          value={plan.monitoringPlan.other || ''}
          onChange={(e) => {
            setPlan(prev => ({
              ...prev,
              monitoringPlan: {
                ...prev.monitoringPlan,
                other: e.target.value
              }
            }));
          }}
          multiline
          rows={2}
          sx={{ mt: 2 }}
        />
      </Paper>
      
      {/* Post-Operative Plan Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Post-Operative Plan</Typography>
        
        <TextField
          fullWidth
          label="Post-Operative Plan"
          value={plan.postOpPlan || ''}
          onChange={handleTextChange('postOpPlan')}
          multiline
          rows={4}
          placeholder="Detailed post-operative care instructions, including pain management, monitoring requirements, etc."
        />
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