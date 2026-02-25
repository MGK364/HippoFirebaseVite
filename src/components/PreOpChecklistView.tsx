import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Divider,
  Typography,
  Box,
  FormGroup,
  FormControlLabel,
  Checkbox,
  alpha,
  useTheme,
  Chip,
  LinearProgress,
  Paper,
  Button,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PrintIcon from '@mui/icons-material/Print';
import { Patient } from '../types';

interface ChecklistItem {
  label: string;
  checked: boolean;
  critical?: boolean;
}

interface ChecklistSection {
  title: string;
  items: ChecklistItem[];
  note?: string;
  critical?: boolean;
}

const buildSections = (): ChecklistSection[] => [
  {
    title: 'Ventilator (if applicable)',
    critical: false,
    items: [
      { label: 'OPEN POP-OFF VALVE (if not immediately starting on ventilator)', checked: false, critical: true },
      { label: 'Leak test of bellows and tubing', checked: false },
      { label: 'Check that ventilator settings are appropriate for patient', checked: false },
    ],
    note: '* For transport gurneys: remove the pressure relief valve before the leak test, then replace it after the leak test.',
  },
  {
    title: 'Airway Equipment',
    critical: false,
    items: [
      { label: 'Laryngoscope light functional', checked: false },
      { label: 'Leak check endotracheal tube cuffs', checked: false },
      { label: 'Endotracheal tubes, gauze squares, tube tie, lube, and cuff syringe available', checked: false },
      { label: 'Facemask available for pre-oxygenation', checked: false },
    ],
  },
  {
    title: 'Monitors & Other Equipment',
    critical: false,
    items: [
      { label: '+/- ECG connected (if indicated)', checked: false },
      { label: '+/- Circulating water blanket ON (if indicated)', checked: false },
      { label: 'Blood pressure monitor available', checked: false },
      { label: 'Appropriate blood pressure cuffs available', checked: false },
      { label: 'Pulse oximeter ready', checked: false },
      { label: 'Capnometer & airway adapter ready', checked: false },
      { label: 'OR/Dentistry/CT/MRI anesthesia machine and monitors turned ON and calibrated', checked: false },
    ],
  },
  {
    title: 'Anesthesia Machine & Breathing System',
    critical: false,
    items: [
      { label: 'Scavenge tube connected to scavenging system or F/Air canister', checked: false },
      { label: 'Breathing system leak test completed for selected circuit', checked: false },
      { label: 'Oxygen supply checked (cylinder and main O₂ source as applicable)', checked: false },
      { label: 'Vaporizer is more than half full (if not, alert nurse/clinician)', checked: false },
      { label: 'OPEN POP-OFF VALVE after leak test is complete', checked: false, critical: true },
    ],
    note: 'Circle (rebreathing) and non-rebreathing systems should be leak-tested according to service instructions (e.g. maintain 30 cmH₂O pressure for at least 10–15 seconds, confirm acceptable flow rates).',
  },
];

interface PreOpChecklistViewProps {
  patient?: Patient | null;
}

const PreOpChecklistView: React.FC<PreOpChecklistViewProps> = ({ patient }) => {
  const theme = useTheme();
  const [sections, setSections] = useState<ChecklistSection[]>(buildSections());

  const toggleItem = (sectionIndex: number, itemIndex: number) => {
    setSections((prev) =>
      prev.map((section, si) =>
        si !== sectionIndex
          ? section
          : {
              ...section,
              items: section.items.map((item, ii) =>
                ii !== itemIndex ? item : { ...item, checked: !item.checked }
              ),
            }
      )
    );
  };

  const allItems = sections.flatMap((s) => s.items);
  const totalCount = allItems.length;
  const checkedCount = allItems.filter((i) => i.checked).length;
  const criticalItems = allItems.filter((i) => i.critical);
  const criticalAllChecked = criticalItems.every((i) => i.checked);
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  const resetChecklist = () => setSections(buildSections());

  return (
    <Box>
      {/* Header card */}
      <Card sx={{ mb: 3 }}>
        <Box
          sx={{
            height: 5,
            background: checkedCount === totalCount
              ? 'linear-gradient(90deg, #2E7D32, #4caf50)'
              : !criticalAllChecked
              ? 'linear-gradient(90deg, #C62828, #ef5350)'
              : 'linear-gradient(90deg, #E65100, #FF9800)',
          }}
        />
        <CardHeader
          title="Pre-Op Equipment Safety Checklist"
          subheader={patient ? `Patient: ${patient.name}` : undefined}
          action={
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button
                size="small"
                variant="text"
                onClick={resetChecklist}
                className="no-print"
                sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
              >
                Reset
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => window.print()}
                className="no-print"
              >
                Print
              </Button>
            </Box>
          }
          sx={{ '& .MuiCardHeader-title': { fontWeight: 700 } }}
        />
        <Divider />
        <CardContent>
          {/* Critical Warning Banner */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.error.main, 0.08),
              border: '1px solid',
              borderColor: alpha(theme.palette.error.main, 0.3),
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <WarningAmberIcon sx={{ color: 'error.main', fontSize: 28, flexShrink: 0 }} />
            <Box>
              <Typography variant="subtitle2" color="error.dark" fontWeight={700}>
                MUST BE COMPLETED BEFORE INDUCING PATIENT
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Items marked with a critical indicator must be verified by a clinician
              </Typography>
            </Box>
          </Paper>

          {/* Progress */}
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="body2" fontWeight={600}>
                Checklist Progress
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip
                  label={`${checkedCount} / ${totalCount}`}
                  size="small"
                  color={checkedCount === totalCount ? 'success' : 'default'}
                />
                {checkedCount === totalCount && (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Complete"
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  backgroundColor:
                    checkedCount === totalCount ? theme.palette.success.main : theme.palette.primary.main,
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Checklist Sections */}
      {sections.map((section, sectionIndex) => (
        <Card key={section.title} sx={{ mb: 2 }}>
          <CardHeader
            title={section.title}
            titleTypographyProps={{ fontWeight: 600, fontSize: '0.95rem', color: 'primary.main' }}
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
              borderBottom: '1px solid',
              borderColor: 'divider',
              py: 1.5,
            }}
          />
          <CardContent>
            <FormGroup>
              {section.items.map((item, itemIndex) => (
                <FormControlLabel
                  key={itemIndex}
                  control={
                    <Checkbox
                      checked={item.checked}
                      onChange={() => toggleItem(sectionIndex, itemIndex)}
                      icon={<RadioButtonUncheckedIcon />}
                      checkedIcon={<CheckCircleIcon />}
                      sx={{
                        color: item.critical ? 'error.light' : 'text.secondary',
                        '&.Mui-checked': {
                          color: 'success.main',
                        },
                      }}
                      size="small"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          textDecoration: item.checked ? 'line-through' : 'none',
                          color: item.checked ? 'text.secondary' : 'text.primary',
                          fontWeight: item.critical ? 700 : item.checked ? 400 : 500,
                        }}
                      >
                        {item.label}
                      </Typography>
                      {item.critical && !item.checked && (
                        <Chip
                          label="CRITICAL"
                          size="small"
                          color="error"
                          sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800 }}
                        />
                      )}
                    </Box>
                  }
                  sx={{
                    py: 0.75,
                    px: 1.5,
                    mb: 0.75,
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: item.checked
                      ? alpha(theme.palette.success.main, 0.3)
                      : item.critical
                      ? alpha(theme.palette.error.main, 0.2)
                      : 'divider',
                    backgroundColor: item.checked
                      ? alpha(theme.palette.success.main, 0.05)
                      : item.critical
                      ? alpha(theme.palette.error.main, 0.03)
                      : 'transparent',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      backgroundColor: item.checked
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

            {section.note && (
              <Box
                sx={{
                  mt: 1.5,
                  p: 1.5,
                  borderRadius: 1.5,
                  backgroundColor: alpha(theme.palette.info.main, 0.06),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.info.main, 0.15),
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                  {section.note}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}

      {/* All complete banner */}
      {checkedCount === totalCount && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mt: 2,
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.success.main, 0.1),
            border: '1px solid',
            borderColor: alpha(theme.palette.success.main, 0.3),
            textAlign: 'center',
          }}
        >
          <CheckCircleIcon sx={{ color: 'success.main', fontSize: 40, mb: 1 }} />
          <Typography variant="h6" color="success.dark" fontWeight={700}>
            Pre-Op Checklist Complete
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            All equipment verified — patient may be induced safely
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default PreOpChecklistView;
