import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import TimerOffOutlinedIcon from '@mui/icons-material/TimerOffOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import MedicationIcon from '@mui/icons-material/Medication';
import AddIcon from '@mui/icons-material/Add';
import { Event } from '../types';
import { addEvent } from '../services/patients';

// ── Props ────────────────────────────────────────────────────────────────────

interface ProcedureTimerProps {
  events: Event[];
  patientId: string;
  currentUser: string;
  onEventAdded: () => void;
  /** Called when the user clicks "Log Event" — opens EventForm in the parent */
  onLogEvent?: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const toDate = (ts: Date | string): Date =>
  ts instanceof Date ? ts : new Date(ts);

/** Find the first Checkpoint event whose title contains "induction" */
const findInductionEvent = (events: Event[]): Event | undefined =>
  events.find(
    (ev) =>
      ev.type === 'Checkpoint' &&
      ev.title.toLowerCase().includes('induction'),
  );

/** Find the first Checkpoint event indicating premedication */
const findPremedicationEvent = (events: Event[]): Event | undefined =>
  events.find(
    (ev) =>
      ev.type === 'Checkpoint' &&
      (ev.title.toLowerCase().includes('premedication') ||
        ev.title.toLowerCase().includes('premed') ||
        ev.title.toLowerCase().includes('pre-med')),
  );

/** Find the first Checkpoint event indicating end of anesthesia / recovery */
const findRecoveryEvent = (events: Event[]): Event | undefined =>
  events.find(
    (ev) =>
      ev.type === 'Checkpoint' &&
      (ev.title.toLowerCase().includes('recovery') ||
        ev.title.toLowerCase().includes('end anesthesia')),
  );

/** Format milliseconds as HH:MM:SS */
const formatElapsed = (ms: number): string => {
  if (ms < 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
};

/** Format a Date to short time string */
const fmtTime = (d: Date | string): string =>
  toDate(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

// ── Component ────────────────────────────────────────────────────────────────

export const ProcedureTimer: React.FC<ProcedureTimerProps> = ({
  events,
  patientId,
  currentUser,
  onEventAdded,
  onLogEvent,
}) => {
  const theme = useTheme();
  const [elapsed, setElapsed] = useState(0);
  const [marking, setMarking] = useState(false);

  const inductionEvent     = findInductionEvent(events);
  const premedicationEvent = findPremedicationEvent(events);
  const recoveryEvent      = findRecoveryEvent(events);

  const inductionTime = inductionEvent ? toDate(inductionEvent.timestamp) : null;
  const recoveryTime  = recoveryEvent  ? toDate(recoveryEvent.timestamp)  : null;

  // ── Timer tick ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!inductionTime) {
      setElapsed(0);
      return;
    }
    if (recoveryTime) {
      // Anesthesia is complete — show static final duration
      setElapsed(recoveryTime.getTime() - inductionTime.getTime());
      return;
    }
    // Active — tick every second
    const tick = () => setElapsed(Date.now() - inductionTime.getTime());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [inductionTime?.getTime(), recoveryTime?.getTime()]);

  // ── Quick-mark handlers ────────────────────────────────────────────────

  const handleMarkPremedication = useCallback(async () => {
    setMarking(true);
    try {
      await addEvent(patientId, {
        type: 'Checkpoint',
        title: 'Premedication',
        details: 'Premedication administered',
        timestamp: new Date(),
        color: '#0288D1',
        createdBy: currentUser,
      });
      onEventAdded();
    } catch (err) {
      console.error('Failed to mark premedication:', err);
    } finally {
      setMarking(false);
    }
  }, [patientId, currentUser, onEventAdded]);

  const handleMarkInduction = useCallback(async () => {
    setMarking(true);
    try {
      await addEvent(patientId, {
        type: 'Checkpoint',
        title: 'Induction',
        details: 'Anesthesia induction marked',
        timestamp: new Date(),
        color: '#2e7d32',
        createdBy: currentUser,
      });
      onEventAdded();
    } catch (err) {
      console.error('Failed to mark induction:', err);
    } finally {
      setMarking(false);
    }
  }, [patientId, currentUser, onEventAdded]);

  const handleMarkRecovery = useCallback(async () => {
    setMarking(true);
    try {
      await addEvent(patientId, {
        type: 'Checkpoint',
        title: 'Recovery',
        details: 'Anesthesia ended — recovery started',
        timestamp: new Date(),
        color: '#7B1FA2',
        createdBy: currentUser,
      });
      onEventAdded();
    } catch (err) {
      console.error('Failed to mark recovery:', err);
    } finally {
      setMarking(false);
    }
  }, [patientId, currentUser, onEventAdded]);

  // ── Derive visual state ─────────────────────────────────────────────────
  // State A: no induction yet
  // State B: induction active (no recovery)
  // State C: recovery recorded (complete)

  const isComplete = !!inductionTime && !!recoveryTime;
  const isActive   = !!inductionTime && !recoveryTime;
  const isPre      = !inductionTime;

  const bgColor = isComplete
    ? alpha('#7B1FA2', 0.05)
    : isActive
    ? alpha(theme.palette.success.main, 0.06)
    : alpha(theme.palette.grey[500], 0.04);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1,
        backgroundColor: bgColor,
        borderBottom: '1px solid',
        borderColor: 'divider',
        flexWrap: 'wrap',
        gap: 1,
      }}
    >
      {/* ── Left: status label ──────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
        {isComplete ? (
          <TimerOffOutlinedIcon sx={{ fontSize: 20, color: '#7B1FA2', flexShrink: 0 }} />
        ) : (
          <TimerOutlinedIcon
            sx={{
              fontSize: 20,
              color: isActive ? 'success.main' : 'text.disabled',
              flexShrink: 0,
            }}
          />
        )}

        {isComplete && (
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#7B1FA2', lineHeight: 1.3 }}
            >
              Anesthesia Complete
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.disabled', fontSize: '0.68rem', lineHeight: 1.2 }}
            >
              Recovery at {fmtTime(recoveryTime!)}
            </Typography>
          </Box>
        )}

        {isActive && (
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, fontSize: '0.78rem', color: 'text.secondary', lineHeight: 1.3 }}
            >
              Anesthesia Duration
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.disabled', fontSize: '0.68rem', lineHeight: 1.2 }}
            >
              Induction at {fmtTime(inductionTime!)}
            </Typography>
          </Box>
        )}

        {isPre && (
          <Box>
            {premedicationEvent ? (
              <>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#0288D1', lineHeight: 1.3 }}
                >
                  Premedication given
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.disabled', fontSize: '0.68rem', lineHeight: 1.2 }}
                >
                  {fmtTime(premedicationEvent.timestamp)} — ready for induction
                </Typography>
              </>
            ) : (
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, fontSize: '0.78rem', color: 'text.disabled' }}
              >
                No induction recorded
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* ── Right: controls + timer ─────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        {/* Log Event button — always available */}
        {onLogEvent && (
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            onClick={onLogEvent}
            sx={{ fontSize: '0.72rem', fontWeight: 600, py: 0.4 }}
          >
            Log Event
          </Button>
        )}

        {/* Pre-induction state */}
        {isPre && (
          <>
            {!premedicationEvent && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<MedicationIcon />}
                onClick={handleMarkPremedication}
                disabled={marking}
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  py: 0.4,
                  color: '#0288D1',
                  borderColor: '#0288D1',
                  '&:hover': { borderColor: '#0277BD', backgroundColor: alpha('#0288D1', 0.04) },
                }}
              >
                Mark Premedication
              </Button>
            )}
            <Button
              variant="outlined"
              color="success"
              size="small"
              startIcon={<PlayArrowIcon />}
              onClick={handleMarkInduction}
              disabled={marking}
              sx={{ fontSize: '0.72rem', fontWeight: 600, py: 0.4 }}
            >
              {marking ? 'Marking…' : 'Mark Induction'}
            </Button>
          </>
        )}

        {/* Active state — live timer + End Anesthesia */}
        {isActive && (
          <>
            <Button
              variant="outlined"
              size="small"
              startIcon={<StopIcon />}
              onClick={handleMarkRecovery}
              disabled={marking}
              sx={{
                fontSize: '0.72rem',
                fontWeight: 600,
                py: 0.4,
                color: '#7B1FA2',
                borderColor: '#7B1FA2',
                '&:hover': { borderColor: '#6A1B9A', backgroundColor: alpha('#7B1FA2', 0.04) },
              }}
            >
              {marking ? 'Marking…' : 'End Anesthesia'}
            </Button>
            <Typography
              sx={{
                fontFamily: '"Roboto Mono", "Courier New", monospace',
                fontWeight: 700,
                fontSize: '1.35rem',
                color: 'success.dark',
                letterSpacing: '0.05em',
                lineHeight: 1,
                minWidth: '5.5ch',
                textAlign: 'right',
              }}
            >
              {formatElapsed(elapsed)}
            </Typography>
          </>
        )}

        {/* Complete state — static final duration */}
        {isComplete && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label="COMPLETE"
              size="small"
              sx={{
                fontSize: '0.62rem',
                fontWeight: 700,
                height: 20,
                backgroundColor: alpha('#7B1FA2', 0.1),
                color: '#7B1FA2',
                letterSpacing: '0.5px',
              }}
            />
            <Typography
              sx={{
                fontFamily: '"Roboto Mono", "Courier New", monospace',
                fontWeight: 700,
                fontSize: '1.35rem',
                color: '#7B1FA2',
                letterSpacing: '0.05em',
                lineHeight: 1,
                minWidth: '5.5ch',
                textAlign: 'right',
                opacity: 0.85,
              }}
            >
              {formatElapsed(elapsed)}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ProcedureTimer;
