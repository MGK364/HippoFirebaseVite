import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Select,
  MenuItem,
  alpha,
  useTheme,
  styled,
  FormControl,
  Tooltip,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { VitalSign } from '../types';
import { addVitalSign } from '../services/patients';
import { getRangeStatus, getRangeTooltip, type RangeStatus } from '../utils/vitalRanges';

// ── Styled: remove browser number spinners ──────────────────────────
const NumberTextField = styled(TextField)({
  '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
    WebkitAppearance: 'none',
    margin: 0,
  },
  '& input[type=number]': {
    MozAppearance: 'textfield',
  },
});

// ── Compact field wrapper (label above input) ───────────────────────
const FieldStack: React.FC<{
  label: string;
  children: React.ReactNode;
  width?: number;
  flex?: boolean;
  required?: boolean;
  status?: RangeStatus;
  tooltip?: string | null;
}> = ({ label, children, width, flex, required, status = 'normal', tooltip }) => {
  const labelColor =
    status === 'critical' ? '#d32f2f'
    : status === 'warning' ? '#f57c00'
    : required ? 'primary.main'
    : 'text.secondary';

  const content = (
    <Box sx={{ width: flex ? undefined : width, flex: flex ? 1 : undefined, minWidth: 0 }}>
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          fontSize: '0.67rem',
          fontWeight: 600,
          color: labelColor,
          mb: 0.25,
          whiteSpace: 'nowrap',
          userSelect: 'none',
          lineHeight: 1.3,
        }}
      >
        {label}
        {required && <span style={{ color: '#C62828', marginLeft: 1 }}>*</span>}
      </Typography>
      {children}
    </Box>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} arrow placement="top">
        {content}
      </Tooltip>
    );
  }
  return content;
};

// ── Helpers ──────────────────────────────────────────────────────────
const FIVE_MIN_MS = 5 * 60 * 1000;

/** Format a Date to a local datetime-local input string (fixes timezone bug) */
const toLocalInputString = (date: Date): string =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

/** Compute the initial timestamp for the next vital sign entry */
const computeNextTimestamp = (vitalSigns: VitalSign[]): string => {
  if (vitalSigns.length === 0) {
    const now = Date.now();
    return toLocalInputString(new Date(Math.ceil(now / FIVE_MIN_MS) * FIVE_MIN_MS));
  }
  const latest = vitalSigns.reduce((max, vs) => {
    const t = vs.timestamp instanceof Date ? vs.timestamp : new Date(vs.timestamp);
    return t.getTime() > max ? t.getTime() : max;
  }, 0);
  return toLocalInputString(new Date(latest + FIVE_MIN_MS));
};

const fahrenheitToCelsius = (f: number): number => (f - 32) * 5 / 9;

// ── Compact input style presets ─────────────────────────────────────
const compactInputProps = {
  style: { fontSize: '0.8rem', padding: '6px 8px' },
};
const compactNumberProps = {
  style: { fontSize: '0.8rem', padding: '6px 6px' },
};

// ── Props ────────────────────────────────────────────────────────────
interface QuickVitalSignEntryProps {
  patientId: string;
  vitalSigns: VitalSign[];
  onVitalSignAdded: () => void;
  currentUser?: string;
}

// ═════════════════════════════════════════════════════════════════════
export const QuickVitalSignEntry: React.FC<QuickVitalSignEntryProps> = ({
  patientId,
  vitalSigns,
  onVitalSignAdded,
  currentUser = 'unknown-user',
}) => {
  const theme = useTheme();

  // ── State ────────────────────────────────────────────────────────
  const [timestamp, setTimestamp] = useState(() => computeNextTimestamp(vitalSigns));
  const [userEditedTimestamp, setUserEditedTimestamp] = useState(false);

  // Required
  const [temperature, setTemperature] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');

  // Optional vitals
  const [meanPressure, setMeanPressure] = useState('');
  const [oxygenSaturation, setOxygenSaturation] = useState('');
  const [etCO2, setEtCO2] = useState('');

  // Gas / anesthesia (persist after save)
  const [o2FlowRate, setO2FlowRate] = useState('');
  const [vaporizerAgent, setVaporizerAgent] = useState('');
  const [vaporizerPercent, setVaporizerPercent] = useState('');

  // Notes
  const [notes, setNotes] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // ── Auto-advance timestamp when vitalSigns changes ───────────────
  useEffect(() => {
    if (!userEditedTimestamp) {
      setTimestamp(computeNextTimestamp(vitalSigns));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vitalSigns]);

  // ── Derive previous values for ghost placeholders + range checks ──
  const prevValues = useMemo(() => {
    if (vitalSigns.length === 0) return null;
    const sorted = [...vitalSigns].sort((a, b) => {
      const ta = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
      const tb = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
      return tb - ta;
    });
    const last = sorted[0];
    const tempF = Math.round(((last.temperature * 9) / 5 + 32) * 10) / 10;
    return {
      temperature: tempF,
      heartRate: last.heartRate,
      respiratoryRate: last.respiratoryRate,
      systolic: last.bloodPressure.systolic,
      diastolic: last.bloodPressure.diastolic,
      meanPressure: last.bloodPressure.mean,
      oxygenSaturation: last.oxygenSaturation > 0 ? last.oxygenSaturation : null,
      etCO2: last.etCO2,
      o2FlowRate: last.o2FlowRate ?? null,
      vaporizerPercent: last.vaporizerPercent ?? null,
      vaporizerAgent: last.vaporizerAgent ?? null,
    };
  }, [vitalSigns]);

  /** Compute field props: ghost placeholder, range status, border sx, tooltip */
  const getFieldIndicators = useCallback((
    rangeKey: string,
    prevValue: number | null | undefined,
    fallbackPlaceholder: string,
  ) => {
    const status = getRangeStatus(rangeKey, prevValue);
    const tooltip = getRangeTooltip(rangeKey, prevValue);
    const placeholder = prevValue != null ? String(prevValue) : fallbackPlaceholder;
    const borderSx = status === 'critical'
      ? { borderLeft: '3px solid #d32f2f' }
      : status === 'warning'
      ? { borderLeft: '3px solid #f57c00' }
      : {};
    return {
      status,
      tooltip,
      placeholder,
      sx: { '& .MuiOutlinedInput-root': { backgroundColor: '#fff', ...borderSx } },
    };
  }, []);

  // ── Submit handler ───────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    setError('');
    setShowSuccess(false);

    // Only one field needs to be filled — reject completely empty submissions
    const hasAnyVital = temperature || heartRate || respiratoryRate || systolic || diastolic
      || meanPressure || oxygenSaturation || etCO2 || o2FlowRate || vaporizerPercent;
    if (!hasAnyVital) {
      setError('Enter at least one value');
      return;
    }

    try {
      setLoading(true);

      // Use 0 as sentinel for "not recorded this reading" — chart filters these out
      const newVitalSign: Omit<VitalSign, 'id'> = {
        timestamp: new Date(timestamp),
        temperature: temperature ? fahrenheitToCelsius(parseFloat(temperature)) : 0,
        heartRate: heartRate ? parseInt(heartRate) : 0,
        respiratoryRate: respiratoryRate ? parseInt(respiratoryRate) : 0,
        bloodPressure: {
          systolic: systolic ? parseInt(systolic) : 0,
          diastolic: diastolic ? parseInt(diastolic) : 0,
          mean: meanPressure ? parseInt(meanPressure) : null,
        },
        oxygenSaturation: oxygenSaturation ? parseInt(oxygenSaturation) : 0,
        etCO2: etCO2 ? parseInt(etCO2) : null,
        notes,
        o2FlowRate: o2FlowRate ? parseFloat(o2FlowRate) : null,
        vaporizerAgent: vaporizerAgent ? (vaporizerAgent as 'Iso' | 'Sevo') : null,
        vaporizerPercent: vaporizerPercent ? parseFloat(vaporizerPercent) : null,
        createdBy: currentUser,
      };

      await addVitalSign(patientId, newVitalSign);

      // Advance timestamp +5 min from the just-saved time
      const savedMs = new Date(timestamp).getTime();
      setTimestamp(toLocalInputString(new Date(savedMs + FIVE_MIN_MS)));
      setUserEditedTimestamp(false);

      // Clear value fields (keep gas fields — they typically persist between readings)
      setTemperature('');
      setHeartRate('');
      setRespiratoryRate('');
      setSystolic('');
      setDiastolic('');
      setMeanPressure('');
      setOxygenSaturation('');
      setEtCO2('');
      setNotes('');
      // Deliberately keep: o2FlowRate, vaporizerAgent, vaporizerPercent

      // Brief success flash
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);

      onVitalSignAdded();
    } catch (err) {
      console.error('Error adding vital sign:', err);
      setError('Save failed. Please retry.');
    } finally {
      setLoading(false);
    }
  }, [
    timestamp, temperature, heartRate, respiratoryRate, systolic, diastolic,
    meanPressure, oxygenSaturation, etCO2, o2FlowRate, vaporizerAgent,
    vaporizerPercent, notes, patientId, onVitalSignAdded, currentUser,
  ]);

  // ── Keyboard shortcut: Enter to submit ───────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  // ── Render ───────────────────────────────────────────────────────
  return (
    <Box
      onKeyDown={handleKeyDown}
      sx={{
        backgroundColor: alpha(theme.palette.grey[100], 0.5),
        borderTop: '1px solid',
        borderColor: 'divider',
        px: 2,
        py: 1.5,
      }}
    >
      {/* Header row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <FiberManualRecordIcon sx={{ fontSize: 8, color: 'success.main' }} />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: 'text.secondary',
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Record Vital Signs
          </Typography>
        </Box>
        {error && (
          <Typography variant="caption" color="error" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>
            {error}
          </Typography>
        )}
      </Box>

      {/* Main layout: field rows + Record button */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'stretch' }}>
        {/* Left: two-row field grid */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>

          {/* Row 1 — Primary vitals (Time · HR · RR · Sys BP · Dia BP · MAP · SpO₂ · EtCO₂ · Temp) */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <FieldStack label="Time" width={152}>
              <TextField
                type="datetime-local"
                size="small"
                value={timestamp}
                onChange={(e) => {
                  setTimestamp(e.target.value);
                  setUserEditedTimestamp(true);
                }}
                slotProps={{ htmlInput: { ...compactInputProps, style: { fontSize: '0.75rem', padding: '6px 8px' } } }}
                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#fff' } }}
                fullWidth
              />
            </FieldStack>

            {(() => { const f = getFieldIndicators('heartRate', prevValues?.heartRate, 'bpm'); return (
            <FieldStack label="HR" width={68} status={f.status} tooltip={f.tooltip}>
              <NumberTextField
                size="small"
                type="number"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                slotProps={{ htmlInput: { step: 1, min: 20, max: 300, ...compactNumberProps } }}
                placeholder={f.placeholder}
                sx={f.sx}
                fullWidth
              />
            </FieldStack>); })()}

            {(() => { const f = getFieldIndicators('respiratoryRate', prevValues?.respiratoryRate, 'bpm'); return (
            <FieldStack label="RR" width={68} status={f.status} tooltip={f.tooltip}>
              <NumberTextField
                size="small"
                type="number"
                value={respiratoryRate}
                onChange={(e) => setRespiratoryRate(e.target.value)}
                slotProps={{ htmlInput: { step: 1, min: 5, max: 100, ...compactNumberProps } }}
                placeholder={f.placeholder}
                sx={f.sx}
                fullWidth
              />
            </FieldStack>); })()}

            {(() => { const f = getFieldIndicators('systolic', prevValues?.systolic, 'mmHg'); return (
            <FieldStack label="Sys BP" width={72} status={f.status} tooltip={f.tooltip}>
              <NumberTextField
                size="small"
                type="number"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                slotProps={{ htmlInput: { step: 1, min: 60, max: 300, ...compactNumberProps } }}
                placeholder={f.placeholder}
                sx={f.sx}
                fullWidth
              />
            </FieldStack>); })()}

            {(() => { const f = getFieldIndicators('diastolic', prevValues?.diastolic, 'mmHg'); return (
            <FieldStack label="Dia BP" width={72} status={f.status} tooltip={f.tooltip}>
              <NumberTextField
                size="small"
                type="number"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                slotProps={{ htmlInput: { step: 1, min: 30, max: 200, ...compactNumberProps } }}
                placeholder={f.placeholder}
                sx={f.sx}
                fullWidth
              />
            </FieldStack>); })()}

            {(() => { const f = getFieldIndicators('meanPressure', prevValues?.meanPressure, 'mmHg'); return (
            <FieldStack label="MAP" width={68} status={f.status} tooltip={f.tooltip}>
              <NumberTextField
                size="small"
                type="number"
                value={meanPressure}
                onChange={(e) => setMeanPressure(e.target.value)}
                slotProps={{ htmlInput: { step: 1, min: 40, max: 200, ...compactNumberProps } }}
                placeholder={f.placeholder}
                sx={f.sx}
                fullWidth
              />
            </FieldStack>); })()}

            {(() => { const f = getFieldIndicators('oxygenSaturation', prevValues?.oxygenSaturation, '%'); return (
            <FieldStack label="SpO₂" width={68} status={f.status} tooltip={f.tooltip}>
              <NumberTextField
                size="small"
                type="number"
                value={oxygenSaturation}
                onChange={(e) => setOxygenSaturation(e.target.value)}
                slotProps={{ htmlInput: { step: 1, min: 70, max: 100, ...compactNumberProps } }}
                placeholder={f.placeholder}
                sx={f.sx}
                fullWidth
              />
            </FieldStack>); })()}

            {(() => { const f = getFieldIndicators('etCO2', prevValues?.etCO2, 'mmHg'); return (
            <FieldStack label="EtCO₂" width={68} status={f.status} tooltip={f.tooltip}>
              <NumberTextField
                size="small"
                type="number"
                value={etCO2}
                onChange={(e) => setEtCO2(e.target.value)}
                slotProps={{ htmlInput: { step: 1, min: 20, max: 80, ...compactNumberProps } }}
                placeholder={f.placeholder}
                sx={f.sx}
                fullWidth
              />
            </FieldStack>); })()}

            {(() => { const f = getFieldIndicators('temperature', prevValues?.temperature, '101'); return (
            <FieldStack label="Temp °F" width={76} status={f.status} tooltip={f.tooltip}>
              <NumberTextField
                size="small"
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                slotProps={{ htmlInput: { step: 0.1, min: 95, max: 107, ...compactNumberProps } }}
                placeholder={f.placeholder}
                sx={f.sx}
                fullWidth
              />
            </FieldStack>); })()}
          </Box>

          {/* Row 2 — Gas / anesthesia / notes */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {(() => { const f = getFieldIndicators('o2FlowRate', prevValues?.o2FlowRate, 'L/min'); return (
            <FieldStack label="O₂ L/min" width={80} status={f.status} tooltip={f.tooltip}>
              <NumberTextField
                size="small"
                type="number"
                value={o2FlowRate}
                onChange={(e) => setO2FlowRate(e.target.value)}
                slotProps={{ htmlInput: { step: 0.1, min: 0, max: 15, ...compactNumberProps } }}
                placeholder={f.placeholder}
                sx={f.sx}
                fullWidth
              />
            </FieldStack>); })()}

            <FieldStack label="Agent" width={100}>
              <FormControl size="small" fullWidth>
                <Select
                  value={vaporizerAgent}
                  onChange={(e) => setVaporizerAgent(e.target.value)}
                  displayEmpty
                  sx={{
                    fontSize: '0.8rem',
                    backgroundColor: '#fff',
                    '& .MuiSelect-select': { py: '6px', px: '8px' },
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.8rem' }}>
                    <em>None</em>
                  </MenuItem>
                  <MenuItem value="Iso" sx={{ fontSize: '0.8rem' }}>Isoflurane</MenuItem>
                  <MenuItem value="Sevo" sx={{ fontSize: '0.8rem' }}>Sevoflurane</MenuItem>
                </Select>
              </FormControl>
            </FieldStack>

            <FieldStack label="Vapor %" width={76}>
              <NumberTextField
                size="small"
                type="number"
                value={vaporizerPercent}
                onChange={(e) => setVaporizerPercent(e.target.value)}
                disabled={!vaporizerAgent}
                slotProps={{ htmlInput: { step: 0.1, min: 0, max: 8, ...compactNumberProps } }}
                placeholder={prevValues?.vaporizerPercent != null ? String(prevValues.vaporizerPercent) : '%'}
                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: vaporizerAgent ? '#fff' : undefined } }}
                fullWidth
              />
            </FieldStack>

            <FieldStack label="Notes" flex>
              <TextField
                size="small"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                slotProps={{ htmlInput: compactInputProps }}
                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#fff' } }}
                fullWidth
              />
            </FieldStack>
          </Box>
        </Box>

        {/* Right: Record button — spans both rows */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'stretch',
            pt: '16px', // offset for the FieldStack label height
          }}
        >
          <Button
            variant="contained"
            color={showSuccess ? 'success' : 'primary'}
            disabled={loading}
            onClick={handleSubmit}
            sx={{
              minWidth: 80,
              fontSize: '0.78rem',
              fontWeight: 700,
              px: 2,
              borderRadius: 1.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
              textTransform: 'none',
              transition: 'background-color 0.3s ease',
            }}
          >
            {showSuccess ? (
              <>
                <CheckCircleOutlineIcon sx={{ fontSize: 22 }} />
                Saved
              </>
            ) : loading ? (
              'Saving...'
            ) : (
              'Record'
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default QuickVitalSignEntry;
