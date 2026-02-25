import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Box, Chip, Grid,
  Accordion, AccordionSummary, AccordionDetails,
  Divider, Alert, styled, alpha,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import HistoryIcon from '@mui/icons-material/History';
import { VitalSign } from '../types';
import {
  getAvailableActions, getRemainingEditTime, formatRemainingTime,
  isVoided, isEdited, VitalSignAction,
} from '../utils/vitalSignPermissions';
import { updateVitalSign, deleteVitalSign, voidVitalSign } from '../services/patients';
import { getRangeStatus, RANGE_COLORS, VitalParam } from '../utils/vitalRanges';

// ── Styled number input (no spinners) ────────────────────────────────────────
const NumberInput = styled(TextField)({
  '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
    WebkitAppearance: 'none', margin: 0,
  },
  '& input[type=number]': { MozAppearance: 'textfield' },
});

// ── Helpers ──────────────────────────────────────────────────────────────────
const toF = (c: number) => Math.round(((c * 9) / 5 + 32) * 10) / 10;
const toC = (f: number) => Math.round(((f - 32) * 5) / 9 * 100) / 100;
const fmtTime = (d: Date | string | undefined) => {
  if (!d) return '—';
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};
const fmtDate = (d: Date | string | undefined) => {
  if (!d) return '';
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + fmtTime(d);
};
const ago = (d: Date | string | undefined) => {
  if (!d) return '';
  const dt = d instanceof Date ? d : new Date(d);
  const ms = Date.now() - dt.getTime();
  if (ms < 60_000) return 'just now';
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  return `${hr}h ${min % 60}m ago`;
};

interface Props {
  open: boolean;
  onClose: () => void;
  vitalSign: VitalSign | null;
  patientId: string;
  currentUser: string;
  onVitalSignUpdated: () => void;
  /** Patient species — used for species-aware range status indicators. */
  species?: string;
}

export const VitalSignActionDialog: React.FC<Props> = ({
  open, onClose, vitalSign, patientId, currentUser, onVitalSignUpdated, species,
}) => {
  const [mode, setMode] = useState<'view' | 'edit' | 'confirmDelete' | 'confirmVoid'>('view');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [remaining, setRemaining] = useState(0);

  // ── Editable field state ──────────────────────────────────────────────
  const [tempF, setTempF] = useState('');
  const [hr, setHr] = useState('');
  const [rr, setRr] = useState('');
  const [sys, setSys] = useState('');
  const [dia, setDia] = useState('');
  const [map_, setMap_] = useState('');
  const [spo2, setSpo2] = useState('');
  const [etco2, setEtco2] = useState('');
  const [o2Flow, setO2Flow] = useState('');
  const [vaporAgent, setVaporAgent] = useState('');
  const [vaporPct, setVaporPct] = useState('');
  const [notes, setNotes] = useState('');

  // Reset state whenever the dialog opens with a new vital sign
  useEffect(() => {
    if (!vitalSign || !open) return;
    setMode('view');
    setReason('');
    setSaving(false);
    setTempF(String(toF(vitalSign.temperature)));
    setHr(String(vitalSign.heartRate));
    setRr(String(vitalSign.respiratoryRate));
    setSys(String(vitalSign.bloodPressure?.systolic ?? ''));
    setDia(String(vitalSign.bloodPressure?.diastolic ?? ''));
    setMap_(vitalSign.bloodPressure?.mean != null ? String(vitalSign.bloodPressure.mean) : '');
    setSpo2(String(vitalSign.oxygenSaturation));
    setEtco2(vitalSign.etCO2 != null ? String(vitalSign.etCO2) : '');
    setO2Flow(vitalSign.o2FlowRate != null ? String(vitalSign.o2FlowRate) : '');
    setVaporAgent(vitalSign.vaporizerAgent ?? '');
    setVaporPct(vitalSign.vaporizerPercent != null ? String(vitalSign.vaporizerPercent) : '');
    setNotes(vitalSign.notes ?? '');
  }, [vitalSign, open]);

  // Live countdown
  useEffect(() => {
    if (!vitalSign || !open) return;
    const tick = () => setRemaining(getRemainingEditTime(vitalSign));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [vitalSign, open]);

  const actions: VitalSignAction[] = vitalSign ? getAvailableActions(vitalSign) : [];
  const voided = vitalSign ? isVoided(vitalSign) : false;
  const edited = vitalSign ? isEdited(vitalSign) : false;

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleSaveEdit = useCallback(async () => {
    if (!vitalSign || reason.trim().length < 3) return;
    setSaving(true);
    try {
      const updates: Partial<VitalSign> = {};
      const newTempC = toC(parseFloat(tempF));
      if (Math.abs(newTempC - vitalSign.temperature) > 0.01) updates.temperature = newTempC;
      if (Number(hr) !== vitalSign.heartRate) updates.heartRate = Number(hr);
      if (Number(rr) !== vitalSign.respiratoryRate) updates.respiratoryRate = Number(rr);
      const newSys = Number(sys), newDia = Number(dia);
      const newMap = map_ ? Number(map_) : null;
      if (newSys !== vitalSign.bloodPressure?.systolic || newDia !== vitalSign.bloodPressure?.diastolic || newMap !== vitalSign.bloodPressure?.mean) {
        updates.bloodPressure = { systolic: newSys, diastolic: newDia, mean: newMap };
      }
      if (Number(spo2) !== vitalSign.oxygenSaturation) updates.oxygenSaturation = Number(spo2);
      const newEtco2 = etco2 ? Number(etco2) : null;
      if (newEtco2 !== (vitalSign.etCO2 ?? null)) updates.etCO2 = newEtco2;
      const newO2 = o2Flow ? Number(o2Flow) : null;
      if (newO2 !== (vitalSign.o2FlowRate ?? null)) updates.o2FlowRate = newO2;
      const newAgent = vaporAgent || null;
      if (newAgent !== (vitalSign.vaporizerAgent ?? null)) updates.vaporizerAgent = newAgent as any;
      const newVPct = vaporPct ? Number(vaporPct) : null;
      if (newVPct !== (vitalSign.vaporizerPercent ?? null)) updates.vaporizerPercent = newVPct;
      if (notes !== (vitalSign.notes ?? '')) updates.notes = notes;

      if (Object.keys(updates).length === 0) {
        onClose();
        return;
      }
      await updateVitalSign(patientId, vitalSign.id, updates, {
        editedBy: currentUser,
        editReason: reason.trim(),
      });
      onVitalSignUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to update vital sign:', err);
    } finally {
      setSaving(false);
    }
  }, [vitalSign, tempF, hr, rr, sys, dia, map_, spo2, etco2, o2Flow, vaporAgent, vaporPct, notes, reason, patientId, currentUser, onVitalSignUpdated, onClose]);

  const handleDelete = useCallback(async () => {
    if (!vitalSign || reason.trim().length < 3) return;
    setSaving(true);
    try {
      await deleteVitalSign(patientId, vitalSign.id, {
        deletedBy: currentUser,
        deleteReason: reason.trim(),
      });
      onVitalSignUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to delete vital sign:', err);
    } finally {
      setSaving(false);
    }
  }, [vitalSign, reason, patientId, currentUser, onVitalSignUpdated, onClose]);

  const handleVoid = useCallback(async () => {
    if (!vitalSign || reason.trim().length < 3) return;
    setSaving(true);
    try {
      await voidVitalSign(patientId, vitalSign.id, {
        voidedBy: currentUser,
        voidReason: reason.trim(),
      });
      onVitalSignUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to void vital sign:', err);
    } finally {
      setSaving(false);
    }
  }, [vitalSign, reason, patientId, currentUser, onVitalSignUpdated, onClose]);

  if (!vitalSign) return null;

  const ts = vitalSign.timestamp instanceof Date ? vitalSign.timestamp : new Date(vitalSign.timestamp);

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
              Vital Signs Record
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {fmtDate(ts)} &middot; {ago(vitalSign.createdAt)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {voided && <Chip label="VOIDED" color="error" size="small" variant="outlined" />}
            {edited && !voided && <Chip label="Edited" color="info" size="small" variant="outlined" />}
            {remaining > 0 && !voided && (
              <Chip
                label={`Edit window: ${formatRemainingTime(remaining)}`}
                color="warning"
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* ── Value summary ───────────────────────────────────────────── */}
        {mode === 'view' && (
          <>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              {(
                [
                  {
                    label: 'Temp',
                    value: `${toF(vitalSign.temperature)}\u00B0F`,
                    param: 'tempF' as VitalParam,
                    numVal: toF(vitalSign.temperature),
                  },
                  {
                    label: 'HR',
                    value: `${vitalSign.heartRate} bpm`,
                    param: 'hr' as VitalParam,
                    numVal: vitalSign.heartRate,
                  },
                  {
                    label: 'RR',
                    value: `${vitalSign.respiratoryRate} bpm`,
                    param: 'rr' as VitalParam,
                    numVal: vitalSign.respiratoryRate,
                  },
                  {
                    label: 'Sys BP',
                    value: `${vitalSign.bloodPressure?.systolic} mmHg`,
                    param: 'sysBP' as VitalParam,
                    numVal: vitalSign.bloodPressure?.systolic ?? null,
                  },
                  {
                    label: 'Dia BP',
                    value: `${vitalSign.bloodPressure?.diastolic} mmHg`,
                    param: 'diaBP' as VitalParam,
                    numVal: vitalSign.bloodPressure?.diastolic ?? null,
                  },
                  {
                    label: 'MAP',
                    value: vitalSign.bloodPressure?.mean != null ? `${vitalSign.bloodPressure.mean} mmHg` : '\u2014',
                    param: 'map' as VitalParam,
                    numVal: vitalSign.bloodPressure?.mean ?? null,
                  },
                  {
                    label: 'SpO\u2082',
                    value: `${vitalSign.oxygenSaturation}%`,
                    param: 'spo2' as VitalParam,
                    numVal: vitalSign.oxygenSaturation,
                  },
                  {
                    label: 'ETCO\u2082',
                    value: vitalSign.etCO2 != null ? `${vitalSign.etCO2} mmHg` : '\u2014',
                    param: 'etco2' as VitalParam,
                    numVal: vitalSign.etCO2 ?? null,
                  },
                  {
                    label: 'O\u2082 Flow',
                    value: vitalSign.o2FlowRate != null ? `${vitalSign.o2FlowRate} L/min` : '\u2014',
                    param: null,
                    numVal: null,
                  },
                  {
                    label: 'Vapor',
                    value: vitalSign.vaporizerAgent
                      ? `${vitalSign.vaporizerAgent} ${vitalSign.vaporizerPercent}%`
                      : '\u2014',
                    param: null,
                    numVal: null,
                  },
                ] as { label: string; value: string; param: VitalParam | null; numVal: number | null }[]
              ).map(({ label, value, param, numVal }) => {
                const showDot = !voided && param !== null && numVal !== null;
                const dotColor = showDot
                  ? RANGE_COLORS[getRangeStatus(param as VitalParam, numVal as number, species)]
                  : undefined;
                return (
                  <Grid size={{ xs: 4 }} key={label}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      {label}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                      {showDot && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: dotColor,
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          textDecoration: voided ? 'line-through' : undefined,
                          opacity: voided ? 0.5 : 1,
                        }}
                      >
                        {value}
                      </Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>

            {vitalSign.notes && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontStyle: 'italic' }}>
                Notes: {vitalSign.notes}
              </Typography>
            )}

            {/* Voided metadata */}
            {voided && (
              <Alert severity="error" variant="outlined" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Voided</Typography>
                <Typography variant="caption" color="text.secondary">
                  By {vitalSign.voidedBy ?? 'unknown'} &middot; {fmtDate(vitalSign.voidedAt ?? undefined)}
                </Typography>
                {vitalSign.voidReason && (
                  <Typography variant="caption" display="block">
                    Reason: {vitalSign.voidReason}
                  </Typography>
                )}
              </Alert>
            )}

            {/* Created by */}
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1 }}>
              Recorded by {vitalSign.createdBy ?? 'unknown'} at {fmtDate(vitalSign.createdAt)}
            </Typography>
          </>
        )}

        {/* ── Edit form ───────────────────────────────────────────────── */}
        {mode === 'edit' && (
          <Box>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid size={{ xs: 4 }}>
                <NumberInput label="Temp °F" size="small" type="number" fullWidth
                  value={tempF} onChange={(e) => setTempF(e.target.value)}
                  slotProps={{ htmlInput: { step: 0.1 } }}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <NumberInput label="HR (bpm)" size="small" type="number" fullWidth
                  value={hr} onChange={(e) => setHr(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <NumberInput label="RR (bpm)" size="small" type="number" fullWidth
                  value={rr} onChange={(e) => setRr(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <NumberInput label="Sys BP" size="small" type="number" fullWidth
                  value={sys} onChange={(e) => setSys(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <NumberInput label="Dia BP" size="small" type="number" fullWidth
                  value={dia} onChange={(e) => setDia(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <NumberInput label="MAP" size="small" type="number" fullWidth
                  value={map_} onChange={(e) => setMap_(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <NumberInput label="SpO₂ (%)" size="small" type="number" fullWidth
                  value={spo2} onChange={(e) => setSpo2(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <NumberInput label="ETCO₂" size="small" type="number" fullWidth
                  value={etco2} onChange={(e) => setEtco2(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <NumberInput label="O₂ Flow" size="small" type="number" fullWidth
                  value={o2Flow} onChange={(e) => setO2Flow(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField label="Vapor Agent" size="small" fullWidth select
                  value={vaporAgent} onChange={(e) => setVaporAgent(e.target.value)}
                  slotProps={{ select: { native: true } }}
                >
                  <option value="">None</option>
                  <option value="Iso">Iso</option>
                  <option value="Sevo">Sevo</option>
                </TextField>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <NumberInput label="Vapor %" size="small" type="number" fullWidth
                  value={vaporPct} onChange={(e) => setVaporPct(e.target.value)}
                  slotProps={{ htmlInput: { step: 0.1 } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Notes" size="small" fullWidth multiline rows={2}
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                />
              </Grid>
            </Grid>

            <TextField
              label="Reason for edit"
              size="small"
              fullWidth
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              error={reason.length > 0 && reason.trim().length < 3}
              helperText="Required (min 3 characters)"
              sx={{ mb: 1 }}
            />
          </Box>
        )}

        {/* ── Confirm delete ──────────────────────────────────────────── */}
        {mode === 'confirmDelete' && (
          <Box>
            <Alert severity="error" sx={{ mb: 2 }}>
              This will permanently remove this vital signs record. This cannot be undone.
            </Alert>
            <TextField
              label="Reason for deletion"
              size="small"
              fullWidth
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              error={reason.length > 0 && reason.trim().length < 3}
              helperText="Required (min 3 characters)"
            />
          </Box>
        )}

        {/* ── Confirm void ────────────────────────────────────────────── */}
        {mode === 'confirmVoid' && (
          <Box>
            <Alert severity="warning" sx={{ mb: 2 }}>
              This will void (soft-delete) this record. The entry will remain visible on the chart with a strikethrough but will not count toward clinical data.
            </Alert>
            <TextField
              label="Reason for voiding"
              size="small"
              fullWidth
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              error={reason.length > 0 && reason.trim().length < 3}
              helperText="Required (min 3 characters)"
            />
          </Box>
        )}

        {/* ── Edit history accordion ──────────────────────────────────── */}
        {edited && mode === 'view' && (
          <Accordion disableGutters variant="outlined" sx={{ mt: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <HistoryIcon sx={{ fontSize: 16, mr: 0.5, color: 'info.main' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Edit History ({vitalSign.editHistory?.length ?? 0})
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              {vitalSign.editHistory?.map((edit, i) => (
                <Box key={i} sx={{ mb: 1.5, '&:last-child': { mb: 0 } }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    {fmtDate(edit.editedAt)} &middot; {edit.editedBy}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    Reason: {edit.editReason}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.disabled">
                    Changed: {Object.keys(edit.previousValues).join(', ')}
                  </Typography>
                  {i < (vitalSign.editHistory?.length ?? 0) - 1 && <Divider sx={{ mt: 1 }} />}
                </Box>
              ))}
            </AccordionDetails>
          </Accordion>
        )}
      </DialogContent>

      {/* ── Actions ──────────────────────────────────────────────────── */}
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        {mode === 'view' && (
          <>
            <Button onClick={onClose} color="inherit" size="small">Close</Button>
            <Box sx={{ flex: 1 }} />
            {actions.includes('edit') && (
              <Button
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<EditIcon />}
                onClick={() => { setMode('edit'); setReason(''); }}
              >
                Edit Values
              </Button>
            )}
            {actions.includes('delete') && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<DeleteIcon />}
                onClick={() => { setMode('confirmDelete'); setReason(''); }}
              >
                Delete
              </Button>
            )}
            {actions.includes('void') && (
              <Button
                variant="outlined"
                color="warning"
                size="small"
                startIcon={<BlockIcon />}
                onClick={() => { setMode('confirmVoid'); setReason(''); }}
              >
                Void Entry
              </Button>
            )}
          </>
        )}

        {mode === 'edit' && (
          <>
            <Button onClick={() => setMode('view')} color="inherit" size="small">Cancel</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              color="primary"
              size="small"
              disabled={saving || reason.trim().length < 3}
              onClick={handleSaveEdit}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        )}

        {mode === 'confirmDelete' && (
          <>
            <Button onClick={() => setMode('view')} color="inherit" size="small">Cancel</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              color="error"
              size="small"
              disabled={saving || reason.trim().length < 3}
              onClick={handleDelete}
            >
              {saving ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </>
        )}

        {mode === 'confirmVoid' && (
          <>
            <Button onClick={() => setMode('view')} color="inherit" size="small">Cancel</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              color="warning"
              size="small"
              disabled={saving || reason.trim().length < 3}
              onClick={handleVoid}
            >
              {saving ? 'Voiding...' : 'Confirm Void'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};
