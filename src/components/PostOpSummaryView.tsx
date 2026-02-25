import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Divider,
  Typography,
  Box,
  Chip,
  Stack,
  Grid,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Paper,
  alpha,
  useTheme,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PrintIcon from '@mui/icons-material/Print';
import { Patient, AnesthesiaPlan } from '../types';

interface PostOpSummaryViewProps {
  patient?: Patient | null;
  anesthesiaPlan?: AnesthesiaPlan | null;
}

interface RecoveryMilestone {
  label: string;
  checked: boolean;
}

const PostOpSummaryView: React.FC<PostOpSummaryViewProps> = ({ patient, anesthesiaPlan }) => {
  const theme = useTheme();

  const recoveryAreaLabel =
    anesthesiaPlan?.recoveryArea === 'Other'
      ? anesthesiaPlan.recoveryAreaOther || 'Other'
      : anesthesiaPlan?.recoveryArea;

  // Recovery milestones state
  const [milestones, setMilestones] = useState<RecoveryMilestone[]>([
    { label: 'Extubated', checked: false },
    { label: 'Sternal recumbency achieved', checked: false },
    { label: 'Standing unassisted', checked: false },
    { label: 'Able to ambulate', checked: false },
    { label: 'Normothermic (≥37.5°C)', checked: false },
    { label: 'Heart rate within normal limits', checked: false },
    { label: 'Respiratory rate within normal limits', checked: false },
    { label: 'SpO₂ ≥95% on room air', checked: false },
    { label: 'Pain score ≤3/10', checked: false },
    { label: 'Drinking/eating (if applicable)', checked: false },
    { label: 'IV catheter removed or maintained per plan', checked: false },
    { label: 'Discharge criteria met', checked: false },
  ]);

  // Recovery notes state
  const [extubationTime, setExtubationTime] = useState('');
  const [recoveryQuality, setRecoveryQuality] = useState('');
  const [painScore, setPainScore] = useState('');
  const [tempAtRecovery, setTempAtRecovery] = useState('');
  const [hrAtRecovery, setHrAtRecovery] = useState('');
  const [rrAtRecovery, setRrAtRecovery] = useState('');
  const [recoveryDuration, setRecoveryDuration] = useState('');
  const [complications, setComplications] = useState('');
  const [recoveryMeds, setRecoveryMeds] = useState('');
  const [handoffNotes, setHandoffNotes] = useState('');
  const [clinicianName, setClinicianName] = useState('');

  const toggleMilestone = (index: number) => {
    setMilestones((prev) =>
      prev.map((m, i) => (i === index ? { ...m, checked: !m.checked } : m))
    );
  };

  const completedCount = milestones.filter((m) => m.checked).length;

  const SectionHeader: React.FC<{ title: string; color?: string }> = ({
    title,
    color = theme.palette.primary.main,
  }) => (
    <Typography
      variant="caption"
      sx={{
        display: 'block',
        mb: 1.5,
        fontWeight: 700,
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        color,
      }}
    >
      {title}
    </Typography>
  );

  return (
    <Box>
      {/* Header card */}
      <Card sx={{ mb: 3 }}>
        <Box
          sx={{
            height: 5,
            background: 'linear-gradient(90deg, #00897B 0%, #1565C0 100%)',
          }}
        />
        <CardHeader
          title="Post-Op Recovery Summary"
          subheader={patient ? `Patient: ${patient.name}` : undefined}
          action={
            <Button
              size="small"
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
              className="no-print"
            >
              Print
            </Button>
          }
          sx={{
            '& .MuiCardHeader-title': { fontWeight: 700 },
          }}
        />
        <Divider />
        <CardContent>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            {recoveryAreaLabel && (
              <Chip
                label={`Recovery Area: ${recoveryAreaLabel}`}
                color="primary"
                variant="outlined"
                size="small"
              />
            )}
            {anesthesiaPlan?.postOpPlan && (
              <Chip
                label="Post-Op Plan on File"
                color="success"
                variant="outlined"
                size="small"
              />
            )}
            <Chip
              label={`${completedCount} / ${milestones.length} milestones`}
              color={completedCount === milestones.length ? 'success' : 'default'}
              variant={completedCount === milestones.length ? 'filled' : 'outlined'}
              size="small"
            />
          </Stack>

          {/* Post-op plan from anesthesia plan */}
          {anesthesiaPlan?.postOpPlan && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.info.main, 0.06),
                border: '1px solid',
                borderColor: alpha(theme.palette.info.main, 0.2),
              }}
            >
              <SectionHeader title="Planned Post-Op Instructions" color={theme.palette.info.dark} />
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {anesthesiaPlan.postOpPlan}
              </Typography>
            </Paper>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Left column: Vitals + Notes */}
        <Grid item xs={12} md={7}>
          {/* Recovery Vitals */}
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="Recovery Parameters"
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
                borderBottom: '1px solid',
                borderColor: 'divider',
                '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '0.95rem' },
                py: 1.5,
              }}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4}>
                  <TextField
                    fullWidth
                    label="Extubation Time"
                    placeholder="e.g. 14:35"
                    value={extubationTime}
                    onChange={(e) => setExtubationTime(e.target.value)}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField
                    fullWidth
                    label="Recovery Duration"
                    placeholder="e.g. 45 min"
                    value={recoveryDuration}
                    onChange={(e) => setRecoveryDuration(e.target.value)}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Recovery Quality</InputLabel>
                    <Select
                      value={recoveryQuality}
                      label="Recovery Quality"
                      onChange={(e) => setRecoveryQuality(e.target.value)}
                    >
                      <MenuItem value="Excellent">Excellent</MenuItem>
                      <MenuItem value="Good">Good</MenuItem>
                      <MenuItem value="Fair">Fair</MenuItem>
                      <MenuItem value="Poor">Poor</MenuItem>
                      <MenuItem value="Complicated">Complicated</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    label="Temp (°C)"
                    placeholder="38.5"
                    value={tempAtRecovery}
                    onChange={(e) => setTempAtRecovery(e.target.value)}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    label="HR (bpm)"
                    placeholder="80"
                    value={hrAtRecovery}
                    onChange={(e) => setHrAtRecovery(e.target.value)}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    label="RR (bpm)"
                    placeholder="20"
                    value={rrAtRecovery}
                    onChange={(e) => setRrAtRecovery(e.target.value)}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Pain Score</InputLabel>
                    <Select
                      value={painScore}
                      label="Pain Score"
                      onChange={(e) => setPainScore(e.target.value)}
                    >
                      {Array.from({ length: 11 }, (_, i) => (
                        <MenuItem key={i} value={String(i)}>{i} / 10</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Complications & Recovery Meds */}
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="Recovery Notes"
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
                borderBottom: '1px solid',
                borderColor: 'divider',
                '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '0.95rem' },
                py: 1.5,
              }}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Complications / Observations"
                    placeholder="Document any complications, unusual events, or notable observations during recovery..."
                    value={complications}
                    onChange={(e) => setComplications(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Medications Administered in Recovery"
                    placeholder="e.g. Hydromorphone 0.05 mg/kg IV x1 at 14:50 for pain score 5/10..."
                    value={recoveryMeds}
                    onChange={(e) => setRecoveryMeds(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Hand-Off Notes to Recovery Staff"
                    placeholder="Include monitoring instructions, pain management plan, activity restrictions, feeding instructions, owner communication points..."
                    value={handoffNotes}
                    onChange={(e) => setHandoffNotes(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Clinician / Anesthetist"
                    placeholder="Name / initials"
                    value={clinicianName}
                    onChange={(e) => setClinicianName(e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right column: Recovery milestones */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardHeader
              title="Recovery Milestones"
              subheader={`${completedCount} of ${milestones.length} completed`}
              sx={{
                backgroundColor:
                  completedCount === milestones.length
                    ? alpha(theme.palette.success.main, 0.08)
                    : alpha(theme.palette.primary.main, 0.04),
                borderBottom: '1px solid',
                borderColor: 'divider',
                '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '0.95rem' },
                '& .MuiCardHeader-subheader': { fontSize: '0.8rem' },
                py: 1.5,
              }}
            />
            <CardContent sx={{ pt: 1.5 }}>
              <FormGroup>
                {milestones.map((milestone, index) => (
                  <FormControlLabel
                    key={index}
                    control={
                      <Checkbox
                        checked={milestone.checked}
                        onChange={() => toggleMilestone(index)}
                        icon={<RadioButtonUncheckedIcon />}
                        checkedIcon={<CheckCircleIcon />}
                        sx={{
                          color: 'text.secondary',
                          '&.Mui-checked': {
                            color: 'success.main',
                          },
                        }}
                        size="small"
                      />
                    }
                    label={
                      <Typography
                        variant="body2"
                        sx={{
                          textDecoration: milestone.checked ? 'line-through' : 'none',
                          color: milestone.checked ? 'text.secondary' : 'text.primary',
                          fontWeight: milestone.checked ? 400 : 500,
                        }}
                      >
                        {milestone.label}
                      </Typography>
                    }
                    sx={{
                      py: 0.5,
                      px: 1,
                      mb: 0.5,
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: milestone.checked
                        ? alpha(theme.palette.success.main, 0.3)
                        : 'divider',
                      backgroundColor: milestone.checked
                        ? alpha(theme.palette.success.main, 0.05)
                        : 'transparent',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        backgroundColor: milestone.checked
                          ? alpha(theme.palette.success.main, 0.08)
                          : alpha(theme.palette.primary.main, 0.04),
                      },
                      mx: 0,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  />
                ))}
              </FormGroup>

              {completedCount === milestones.length && (
                <Box
                  sx={{
                    mt: 2,
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                    border: '1px solid',
                    borderColor: alpha(theme.palette.success.main, 0.3),
                    textAlign: 'center',
                  }}
                >
                  <CheckCircleIcon sx={{ color: 'success.main', fontSize: 28, mb: 0.5 }} />
                  <Typography variant="subtitle2" color="success.dark" fontWeight={700}>
                    All milestones met!
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Patient is ready for discharge
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PostOpSummaryView;
