import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import StopIcon from '@mui/icons-material/Stop';
import { CRIMedication, BolusMedication } from './MedicationTimeline';

interface MedicationAdministrationProps {
  activeCRIs: CRIMedication[];
  recentBoluses: BolusMedication[];
  onAddMedication: (medication: Omit<CRIMedication, 'id' | 'color'> | Omit<BolusMedication, 'id' | 'color'>, type: 'cri' | 'bolus') => void;
  onEditRate: (medicationId: string, newRate: number) => void;
  onStopMedication: (medicationId: string) => void;
}

// Common drug options for the dropdown
const commonDrugs = [
  { name: 'Ketamine', defaultUnit: 'mcg/kg/min', type: 'cri' },
  { name: 'Lidocaine', defaultUnit: 'mcg/kg/min', type: 'cri' },
  { name: 'Hydromorphone', defaultUnit: 'mg', type: 'bolus' },
  { name: 'Propofol', defaultUnit: 'mg/kg', type: 'bolus' },
  { name: 'Midazolam', defaultUnit: 'mg', type: 'bolus' },
  { name: 'Lactated Ringers', defaultUnit: 'mL/kg/hr', type: 'cri' },
];

type MedicationType = 'cri' | 'bolus';

const MedicationAdministration: React.FC<MedicationAdministrationProps> = ({
  activeCRIs,
  recentBoluses,
  onAddMedication,
  onEditRate,
  onStopMedication
}) => {
  // State for add medication dialog
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [addType, setAddType] = useState<MedicationType>('cri');
  const [selectedDrug, setSelectedDrug] = useState('');
  const [dosage, setDosage] = useState('');
  const [unit, setUnit] = useState('');

  // State for edit rate dialog
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editMedicationId, setEditMedicationId] = useState('');
  const [newRate, setNewRate] = useState('');

  // Handle opening add medication dialog
  const handleOpenAddDialog = (type: MedicationType) => {
    setAddType(type);
    setSelectedDrug('');
    setDosage('');
    setUnit('');
    setOpenAddDialog(true);
  };

  // Handle drug selection
  const handleDrugChange = (drug: string) => {
    setSelectedDrug(drug);
    const selectedDrugInfo = commonDrugs.find(d => d.name === drug);
    if (selectedDrugInfo) {
      setUnit(selectedDrugInfo.defaultUnit);
    }
  };

  // Handle add medication submission
  const handleAddMedication = () => {
    if (!selectedDrug || !dosage) return;

    if (addType === 'cri') {
      onAddMedication({
        name: selectedDrug,
        rate: parseFloat(dosage),
        unit,
        startTime: new Date(),
      }, 'cri');
    } else {
      onAddMedication({
        name: selectedDrug,
        dose: parseFloat(dosage),
        unit,
        time: new Date(),
      }, 'bolus');
    }

    setOpenAddDialog(false);
  };

  // Handle opening edit rate dialog
  const handleOpenEditDialog = (medicationId: string, currentRate: number) => {
    setEditMedicationId(medicationId);
    setNewRate(currentRate.toString());
    setOpenEditDialog(true);
  };

  // Handle edit rate submission
  const handleEditRate = () => {
    if (!editMedicationId || !newRate) return;
    onEditRate(editMedicationId, parseFloat(newRate));
    setOpenEditDialog(false);
  };

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            Medication Administration
          </Typography>
          <Box>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenAddDialog('cri')}
              sx={{ mr: 1 }}
            >
              Add Medication
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenAddDialog('bolus')}
            >
              Add CRI
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="h6" sx={{ mb: 2 }}>
          Constant Rate Infusions
        </Typography>

        {activeCRIs.length === 0 ? (
          <Typography color="text.secondary">No active CRIs</Typography>
        ) : (
          <Stack spacing={2}>
            {activeCRIs.map((cri) => (
              <Card key={cri.id} variant="outlined" sx={{ backgroundColor: `${cri.color}20` }}>
                <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ flex: '0 0 25%' }}>
                      <Typography variant="subtitle1">{cri.name}</Typography>
                    </Box>
                    <Box sx={{ flex: '0 0 33%' }}>
                      <Typography variant="body2">
                        Rate: {cri.rate} {cri.unit}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: '0 0 25%' }}>
                      <Typography variant="body2">
                        Started: {cri.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: '0 0 17%', textAlign: 'right' }}>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleOpenEditDialog(cri.id, cri.rate)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="secondary"
                        onClick={() => onStopMedication(cri.id)}
                      >
                        <StopIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
          Recent Medications
        </Typography>

        {recentBoluses.length === 0 ? (
          <Typography color="text.secondary">No recent medications</Typography>
        ) : (
          <Stack spacing={2}>
            {recentBoluses.map((bolus) => (
              <Card key={bolus.id} variant="outlined" sx={{ backgroundColor: `${bolus.color}20` }}>
                <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ flex: '0 0 33%' }}>
                      <Typography variant="subtitle1">{bolus.name}</Typography>
                    </Box>
                    <Box sx={{ flex: '0 0 33%' }}>
                      <Typography variant="body2">
                        Dose: {bolus.dose} {bolus.unit} {bolus.unit === 'mg' ? '(IV)' : ''}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: '0 0 33%' }}>
                      <Typography variant="body2">
                        Time: {bolus.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Paper>

      {/* Add Medication Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle>
          {addType === 'cri' ? 'Add Constant Rate Infusion' : 'Add Medication'}
        </DialogTitle>
        <DialogContent sx={{ width: 400, pt: 1 }}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Medication</InputLabel>
            <Select
              value={selectedDrug}
              onChange={(e) => handleDrugChange(e.target.value)}
              label="Medication"
            >
              {commonDrugs
                .filter(drug => (addType === 'cri' ? drug.type === 'cri' : drug.type === 'bolus'))
                .map((drug) => (
                  <MenuItem key={drug.name} value={drug.name}>
                    {drug.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            label={addType === 'cri' ? 'Rate' : 'Dose'}
            type="number"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            InputProps={{ endAdornment: unit }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddMedication} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Rate Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>Edit Infusion Rate</DialogTitle>
        <DialogContent sx={{ width: 400, pt: 1 }}>
          <TextField
            fullWidth
            margin="normal"
            label="New Rate"
            type="number"
            value={newRate}
            onChange={(e) => setNewRate(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditRate} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MedicationAdministration; 