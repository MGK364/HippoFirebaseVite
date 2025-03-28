import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Grid as MuiGrid,
  Divider,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Alert,
  Chip,
  IconButton,
  InputAdornment,
  CircularProgress,
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { MedicalSummary } from '../types';
import { updateMedicalSummary } from '../services/patients';
import { useAuth } from '../contexts/AuthContext';

interface MedicalSummaryFormProps {
  patientId: string;
  initialSummary: MedicalSummary | null;
  onSave?: () => void;
}

const MedicalSummaryForm: React.FC<MedicalSummaryFormProps> = ({ patientId, initialSummary, onSave }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formValues, setFormValues] = useState<Omit<MedicalSummary, 'id'>>({
    temperament: initialSummary?.temperament || '',
    bcs: initialSummary?.bcs || '',
    historyText: initialSummary?.historyText || '',
    previousDiagnoses: initialSummary?.previousDiagnoses || [],
    previousAnesthesia: initialSummary?.previousAnesthesia || false,
    anesthesiaDetails: initialSummary?.anesthesiaDetails || '',
    ivInPlace: initialSummary?.ivInPlace || false,
    ettSize: initialSummary?.ettSize || '',
    physicalExam: {
      temp: initialSummary?.physicalExam?.temp || 0,
      heartRate: initialSummary?.physicalExam?.heartRate || 0,
      respRate: initialSummary?.physicalExam?.respRate || 0,
      age: initialSummary?.physicalExam?.age || '',
      weight: initialSummary?.physicalExam?.weight || '',
      mucousMembranes: initialSummary?.physicalExam?.mucousMembranes || '',
      crt: initialSummary?.physicalExam?.crt || '',
      pulseQuality: initialSummary?.physicalExam?.pulseQuality || '',
      auscultation: initialSummary?.physicalExam?.auscultation || ''
    },
    labValues: {
      pcv: initialSummary?.labValues?.pcv || '',
      tp: initialSummary?.labValues?.tp || '',
      bun: initialSummary?.labValues?.bun || '',
      sodium: initialSummary?.labValues?.sodium || '',
      potassium: initialSummary?.labValues?.potassium || '',
      chloride: initialSummary?.labValues?.chloride || '',
      calcium: initialSummary?.labValues?.calcium || '',
      glucose: initialSummary?.labValues?.glucose || '',
      creatinine: initialSummary?.labValues?.creatinine || '',
      albumin: initialSummary?.labValues?.albumin || '',
      alkp: initialSummary?.labValues?.alkp || '',
      ast: initialSummary?.labValues?.ast || '',
      alt: initialSummary?.labValues?.alt || '',
      tbil: initialSummary?.labValues?.tbil || '',
      platelets: initialSummary?.labValues?.platelets || '',
      wbc: initialSummary?.labValues?.wbc || '',
      pt_ptt: initialSummary?.labValues?.pt_ptt || '',
      crossmatch: initialSummary?.labValues?.crossmatch || ''
    },
    cardioStatus: initialSummary?.cardioStatus || '',
    respiratoryStatus: initialSummary?.respiratoryStatus || '',
    neuroMuscStatus: initialSummary?.neuroMuscStatus || '',
    currentMeds: initialSummary?.currentMeds || [],
    asaStatus: initialSummary?.asaStatus || 'I',
    problemList: initialSummary?.problemList || [],
    anestheticComplications: initialSummary?.anestheticComplications || [],
    cpr: initialSummary?.cpr || false,
    clientAuth: initialSummary?.clientAuth || false,
    lastUpdated: initialSummary?.lastUpdated || new Date(),
    updatedBy: initialSummary?.updatedBy || currentUser?.email || currentUser?.uid || ''
  });

  const [newDiagnosis, setNewDiagnosis] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [newProblem, setNewProblem] = useState('');
  const [newComplication, setNewComplication] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormValues(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormValues(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePhysicalExamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      physicalExam: {
        ...prev.physicalExam,
        [name]: value
      }
    }));
  };

  const handleLabValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      labValues: {
        ...prev.labValues,
        [name]: value
      }
    }));
  };

  const handleAddDiagnosis = () => {
    if (!newDiagnosis.trim()) return;
    setFormValues(prev => ({
      ...prev,
      previousDiagnoses: [...prev.previousDiagnoses, newDiagnosis.trim()]
    }));
    setNewDiagnosis('');
  };

  const handleRemoveDiagnosis = (index: number) => {
    setFormValues(prev => ({
      ...prev,
      previousDiagnoses: prev.previousDiagnoses.filter((_, i) => i !== index)
    }));
  };

  const handleAddMedication = () => {
    if (!newMedication.trim()) return;
    setFormValues(prev => ({
      ...prev,
      currentMeds: [...prev.currentMeds, newMedication.trim()]
    }));
    setNewMedication('');
  };

  const handleRemoveMedication = (index: number) => {
    setFormValues(prev => ({
      ...prev,
      currentMeds: prev.currentMeds.filter((_, i) => i !== index)
    }));
  };

  const handleAddProblem = () => {
    if (!newProblem.trim()) return;
    setFormValues(prev => ({
      ...prev,
      problemList: [...prev.problemList, newProblem.trim()]
    }));
    setNewProblem('');
  };

  const handleRemoveProblem = (index: number) => {
    setFormValues(prev => ({
      ...prev,
      problemList: prev.problemList.filter((_, i) => i !== index)
    }));
  };

  const handleAddComplication = () => {
    if (!newComplication.trim()) return;
    setFormValues(prev => ({
      ...prev,
      anestheticComplications: [...prev.anestheticComplications, newComplication.trim()]
    }));
    setNewComplication('');
  };

  const handleRemoveComplication = (index: number) => {
    setFormValues(prev => ({
      ...prev,
      anestheticComplications: prev.anestheticComplications.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Update the lastUpdated and updatedBy fields
      const updatedSummary = {
        ...formValues,
        lastUpdated: new Date(),
        updatedBy: currentUser?.email || currentUser?.uid || 'unknown'
      };

      await updateMedicalSummary(patientId, updatedSummary);
      setSuccess(true);
      
      if (onSave) {
        onSave();
      }

      // Return to patient details after a short delay
      setTimeout(() => {
        navigate(`/patients/${patientId}`);
      }, 1500);
    } catch (err) {
      console.error('Error saving medical summary:', err);
      setError('Failed to save medical summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Medical summary saved successfully!
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          General Information
        </Typography>
        <MuiGrid container spacing={2}>
          <MuiGrid item xs={12} md={6}>
            <TextField
              label="Temperament"
              name="temperament"
              value={formValues.temperament}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={6}>
            <TextField
              label="Body Condition Score"
              name="bcs"
              value={formValues.bcs}
              onChange={handleChange}
              fullWidth
              margin="normal"
              placeholder="e.g. 5/9"
            />
          </MuiGrid>
        </MuiGrid>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Medical History
        </Typography>
        <TextField
          label="History"
          name="historyText"
          value={formValues.historyText}
          onChange={handleChange}
          fullWidth
          multiline
          rows={4}
          margin="normal"
        />

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Previous Diagnoses
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {formValues.previousDiagnoses.map((diagnosis, index) => (
              <Chip
                key={index}
                label={diagnosis}
                onDelete={() => handleRemoveDiagnosis(index)}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="Add Diagnosis"
              value={newDiagnosis}
              onChange={(e) => setNewDiagnosis(e.target.value)}
              size="small"
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleAddDiagnosis}
              startIcon={<AddIcon />}
            >
              Add
            </Button>
          </Box>
        </Box>

        <Box sx={{ mt: 3 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formValues.previousAnesthesia}
                onChange={handleChange}
                name="previousAnesthesia"
              />
            }
            label="Previous Anesthesia"
          />
          <TextField
            label="Anesthesia Details"
            name="anesthesiaDetails"
            value={formValues.anesthesiaDetails}
            onChange={handleChange}
            fullWidth
            disabled={!formValues.previousAnesthesia}
            margin="normal"
          />
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Current Status
        </Typography>
        <MuiGrid container spacing={2}>
          <MuiGrid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formValues.ivInPlace}
                  onChange={handleChange}
                  name="ivInPlace"
                />
              }
              label="IV In Place"
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={6}>
            <TextField
              label="ETT Size"
              name="ettSize"
              value={formValues.ettSize}
              onChange={handleChange}
              fullWidth
            />
          </MuiGrid>
        </MuiGrid>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Physical Examination
        </Typography>
        <MuiGrid container spacing={2}>
          <MuiGrid item xs={12} md={4}>
            <TextField
              label="Temperature"
              name="temp"
              type="number"
              value={formValues.physicalExam.temp}
              onChange={handlePhysicalExamChange}
              fullWidth
              margin="normal"
              InputProps={{
                endAdornment: <InputAdornment position="end">°F</InputAdornment>,
              }}
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={4}>
            <TextField
              label="Heart Rate"
              name="heartRate"
              type="number"
              value={formValues.physicalExam.heartRate}
              onChange={handlePhysicalExamChange}
              fullWidth
              margin="normal"
              InputProps={{
                endAdornment: <InputAdornment position="end">bpm</InputAdornment>,
              }}
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={4}>
            <TextField
              label="Respiratory Rate"
              name="respRate"
              type="number"
              value={formValues.physicalExam.respRate}
              onChange={handlePhysicalExamChange}
              fullWidth
              margin="normal"
              InputProps={{
                endAdornment: <InputAdornment position="end">rpm</InputAdornment>,
              }}
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={4}>
            <TextField
              label="Age"
              name="age"
              value={formValues.physicalExam.age}
              onChange={handlePhysicalExamChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={4}>
            <TextField
              label="Weight"
              name="weight"
              value={formValues.physicalExam.weight}
              onChange={handlePhysicalExamChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={4}>
            <TextField
              label="Mucous Membranes"
              name="mucousMembranes"
              value={formValues.physicalExam.mucousMembranes}
              onChange={handlePhysicalExamChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={4}>
            <TextField
              label="CRT"
              name="crt"
              value={formValues.physicalExam.crt}
              onChange={handlePhysicalExamChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={4}>
            <TextField
              label="Pulse Quality"
              name="pulseQuality"
              value={formValues.physicalExam.pulseQuality}
              onChange={handlePhysicalExamChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={4}>
            <TextField
              label="Auscultation"
              name="auscultation"
              value={formValues.physicalExam.auscultation}
              onChange={handlePhysicalExamChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
        </MuiGrid>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Lab Values
        </Typography>
        <MuiGrid container spacing={2}>
          <MuiGrid item xs={12} md={3}>
            <TextField
              label="PCV"
              name="pcv"
              value={formValues.labValues.pcv}
              onChange={handleLabValueChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={3}>
            <TextField
              label="TP"
              name="tp"
              value={formValues.labValues.tp}
              onChange={handleLabValueChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={3}>
            <TextField
              label="BUN"
              name="bun"
              value={formValues.labValues.bun}
              onChange={handleLabValueChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={3}>
            <TextField
              label="Sodium"
              name="sodium"
              value={formValues.labValues.sodium}
              onChange={handleLabValueChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={3}>
            <TextField
              label="Potassium"
              name="potassium"
              value={formValues.labValues.potassium}
              onChange={handleLabValueChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={3}>
            <TextField
              label="Chloride"
              name="chloride"
              value={formValues.labValues.chloride}
              onChange={handleLabValueChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={3}>
            <TextField
              label="Calcium"
              name="calcium"
              value={formValues.labValues.calcium}
              onChange={handleLabValueChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={3}>
            <TextField
              label="Glucose"
              name="glucose"
              value={formValues.labValues.glucose}
              onChange={handleLabValueChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={3}>
            <TextField
              label="Creatinine"
              name="creatinine"
              value={formValues.labValues.creatinine}
              onChange={handleLabValueChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={3}>
            <TextField
              label="Albumin"
              name="albumin"
              value={formValues.labValues.albumin}
              onChange={handleLabValueChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={3}>
            <TextField
              label="ALKP"
              name="alkp"
              value={formValues.labValues.alkp}
              onChange={handleLabValueChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={3}>
            <TextField
              label="AST"
              name="ast"
              value={formValues.labValues.ast}
              onChange={handleLabValueChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={3}>
            <TextField
              label="ALT"
              name="alt"
              value={formValues.labValues.alt}
              onChange={handleLabValueChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={3}>
            <TextField
              label="Total Bilirubin"
              name="tbil"
              value={formValues.labValues.tbil}
              onChange={handleLabValueChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={3}>
            <TextField
              label="Platelets"
              name="platelets"
              value={formValues.labValues.platelets}
              onChange={handleLabValueChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={3}>
            <TextField
              label="WBC"
              name="wbc"
              value={formValues.labValues.wbc}
              onChange={handleLabValueChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={3}>
            <TextField
              label="PT/PTT"
              name="pt_ptt"
              value={formValues.labValues.pt_ptt}
              onChange={handleLabValueChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={3}>
            <TextField
              label="Crossmatch"
              name="crossmatch"
              value={formValues.labValues.crossmatch}
              onChange={handleLabValueChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
        </MuiGrid>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Status Assessment
        </Typography>
        <MuiGrid container spacing={2}>
          <MuiGrid item xs={12} md={4}>
            <TextField
              label="Cardiovascular Status"
              name="cardioStatus"
              value={formValues.cardioStatus}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={4}>
            <TextField
              label="Respiratory Status"
              name="respiratoryStatus"
              value={formValues.respiratoryStatus}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
          <MuiGrid item xs={12} md={4}>
            <TextField
              label="Neuromuscular Status"
              name="neuroMuscStatus"
              value={formValues.neuroMuscStatus}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
          </MuiGrid>
        </MuiGrid>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Current Medications
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {formValues.currentMeds.map((med, index) => (
              <Chip
                key={index}
                label={med}
                onDelete={() => handleRemoveMedication(index)}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="Add Medication"
              value={newMedication}
              onChange={(e) => setNewMedication(e.target.value)}
              size="small"
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleAddMedication}
              startIcon={<AddIcon />}
            >
              Add
            </Button>
          </Box>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Anesthetic Risk Assessment
        </Typography>
        
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">ASA Status</FormLabel>
          <RadioGroup
            row
            name="asaStatus"
            value={formValues.asaStatus}
            onChange={handleChange}
          >
            <FormControlLabel value="I" control={<Radio />} label="I" />
            <FormControlLabel value="II" control={<Radio />} label="II" />
            <FormControlLabel value="III" control={<Radio />} label="III" />
            <FormControlLabel value="IV" control={<Radio />} label="IV" />
            <FormControlLabel value="V" control={<Radio />} label="V" />
            <FormControlLabel value="E" control={<Radio />} label="E (Emergency)" />
          </RadioGroup>
        </FormControl>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Problem List
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {formValues.problemList.map((problem, index) => (
              <Chip
                key={index}
                label={problem}
                onDelete={() => handleRemoveProblem(index)}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="Add Problem"
              value={newProblem}
              onChange={(e) => setNewProblem(e.target.value)}
              size="small"
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleAddProblem}
              startIcon={<AddIcon />}
            >
              Add
            </Button>
          </Box>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Possible Anesthetic Complications
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {formValues.anestheticComplications.map((comp, index) => (
              <Chip
                key={index}
                label={comp}
                onDelete={() => handleRemoveComplication(index)}
                color="error"
                variant="outlined"
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="Add Complication"
              value={newComplication}
              onChange={(e) => setNewComplication(e.target.value)}
              size="small"
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleAddComplication}
              startIcon={<AddIcon />}
              color="error"
            >
              Add
            </Button>
          </Box>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Emergency Preferences
        </Typography>
        <MuiGrid container spacing={2}>
          <MuiGrid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formValues.cpr}
                  onChange={handleChange}
                  name="cpr"
                />
              }
              label="CPR Authorized"
            />
          </MuiGrid>
          <MuiGrid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formValues.clientAuth}
                  onChange={handleChange}
                  name="clientAuth"
                />
              }
              label="Client Authorization Obtained"
            />
          </MuiGrid>
        </MuiGrid>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate(`/patients/${patientId}`)}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Saving...' : 'Save Medical Summary'}
        </Button>
      </Box>
    </form>
  );
};

export default MedicalSummaryForm; 