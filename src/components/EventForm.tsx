import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Typography,
  alpha,
} from '@mui/material';
import { Event } from '../types';
import { addEvent } from '../services/patients';
import { useAuth } from '../contexts/AuthContext';

interface EventFormProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  onEventAdded: () => void;
  initialTimestamp?: Date;
}

const EVENT_TYPES = [
  { value: 'Checkpoint', label: 'Checkpoint', color: '#0288D1' },
  { value: 'Procedure',  label: 'Procedure',  color: '#2e7d32' },
  { value: 'Note',       label: 'Note',       color: '#ed6c02' },
];

// ── Quick procedure presets ──────────────────────────────────────────────────
// Clicking a preset pre-fills the event type, title, and applies a specific
// color so that each phase is visually distinct on the chart.

const PROCEDURE_PRESETS = [
  // ── Anesthesia checkpoints ──────────────────────────────────────────────
  { label: 'Premedication', title: 'Premedication', type: 'Checkpoint' as Event['type'], color: '#0288D1' },
  { label: 'Induction',     title: 'Induction',     type: 'Checkpoint' as Event['type'], color: '#2e7d32' },
  { label: 'Extubation',    title: 'Extubation',    type: 'Checkpoint' as Event['type'], color: '#F57C00' },
  { label: 'End Anesthesia',title: 'Recovery',      type: 'Checkpoint' as Event['type'], color: '#7B1FA2' },
  // ── Surgical procedures ─────────────────────────────────────────────────
  { label: 'Surgery Start', title: 'Surgery Start', type: 'Procedure'  as Event['type'], color: '#E53935' },
  { label: 'Surgery End',   title: 'Surgery End',   type: 'Procedure'  as Event['type'], color: '#795548' },
];

export const EventForm: React.FC<EventFormProps> = ({
  open,
  onClose,
  patientId,
  onEventAdded,
  initialTimestamp = new Date(),
}) => {
  const { currentUser } = useAuth();
  const [eventType, setEventType] = useState<Event['type']>('Note');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [timestamp, setTimestamp] = useState<Date>(initialTimestamp);
  /** When set, overrides the type-based color (used by procedure presets). */
  const [presetColor, setPresetColor] = useState<string | null>(null);

  // Format the initial timestamp for the datetime-local input
  const formatDateTimeForInput = (date: Date) => {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const [dateTimeValue, setDateTimeValue] = useState(formatDateTimeForInput(initialTimestamp));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Resolve the color to store: preset override > type default
  const getEventColor = () => {
    if (presetColor) return presetColor;
    return EVENT_TYPES.find((t) => t.value === eventType)?.color ?? '#9e9e9e';
  };

  // Which preset is currently active?
  const activePreset = PROCEDURE_PRESETS.find(
    (p) => p.title === title && p.type === eventType && p.color === presetColor,
  );

  const handlePresetClick = (preset: (typeof PROCEDURE_PRESETS)[number]) => {
    setEventType(preset.type);
    setTitle(preset.title);
    setPresetColor(preset.color);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const eventTimestamp = new Date(dateTimeValue);

      const newEvent: Omit<Event, 'id'> = {
        type: eventType,
        title: title.trim(),
        details: details.trim(),
        timestamp: eventTimestamp,
        color: getEventColor(),
        createdBy: currentUser?.displayName || currentUser?.email || 'Unknown user',
      };

      await addEvent(patientId, newEvent);

      // Reset form
      setEventType('Note');
      setTitle('');
      setDetails('');
      setPresetColor(null);
      setDateTimeValue(formatDateTimeForInput(new Date()));

      onEventAdded();
      onClose();
    } catch (err) {
      console.error('Error adding event:', err);
      setError('Failed to add event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Log Event</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* ── Quick procedure presets ─────────────────────────────────── */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                fontWeight: 700,
                fontSize: '0.65rem',
                letterSpacing: '0.6px',
                color: 'text.disabled',
                mb: 0.75,
                textTransform: 'uppercase',
              }}
            >
              Quick Presets
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {PROCEDURE_PRESETS.map((preset) => {
                const isActive = activePreset?.label === preset.label;
                return (
                  <Chip
                    key={preset.label}
                    label={preset.label}
                    size="small"
                    onClick={() => handlePresetClick(preset)}
                    sx={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      height: 26,
                      borderColor: preset.color,
                      border: '1.5px solid',
                      color: isActive ? '#fff' : preset.color,
                      backgroundColor: isActive ? preset.color : 'transparent',
                      '&:hover': {
                        backgroundColor: isActive
                          ? preset.color
                          : alpha(preset.color, 0.1),
                      },
                    }}
                  />
                );
              })}
            </Box>
          </Box>

          {/* ── Event type + time ───────────────────────────────────────── */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="event-type-label">Event Type</InputLabel>
              <Select
                labelId="event-type-label"
                value={eventType}
                onChange={(e) => {
                  setEventType(e.target.value as Event['type']);
                  setPresetColor(null); // clear preset override on manual type change
                }}
                label="Event Type"
                required
              >
                {EVENT_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Event Time"
              type="datetime-local"
              value={dateTimeValue}
              onChange={(e) => setDateTimeValue(e.target.value)}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            margin="normal"
            required
          />

          <TextField
            label="Details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EventForm;
