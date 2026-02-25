import React, { useState } from 'react';
import {
  Box,
  Typography,
  Collapse,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Tabs,
  Tab,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { Event, VitalSign } from '../types';

// ── Props ────────────────────────────────────────────────────────────────────

interface AnesthesiaDataLogProps {
  events: Event[];
  vitalSigns: VitalSign[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtTime = (ts: Date | string): string => {
  const d = ts instanceof Date ? ts : new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const toF = (c: number): string =>
  (Math.round(((c * 9) / 5 + 32) * 10) / 10).toFixed(1) + '°F';

const nullStr = (v: number | null | undefined): string =>
  v == null ? '—' : String(v);

// ── Component ─────────────────────────────────────────────────────────────────

export const AnesthesiaDataLog: React.FC<AnesthesiaDataLogProps> = ({
  events,
  vitalSigns,
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);

  const sortedEvents = [...events].sort((a, b) => {
    const ta = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
    const tb = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
    return ta.getTime() - tb.getTime();
  });

  const sortedVitals = [...vitalSigns]
    .filter((vs) => !vs.voidedAt) // exclude voided entries from table by default
    .sort((a, b) => {
      const ta = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      const tb = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
      return ta.getTime() - tb.getTime();
    });

  // ── Sticky header cell style ─────────────────────────────────────────────
  const th = {
    fontWeight: 700,
    fontSize: '0.68rem',
    whiteSpace: 'nowrap',
    backgroundColor: alpha(theme.palette.grey[100], 1),
    py: 0.75,
    px: 1,
    lineHeight: 1.4,
  } as const;

  const td = {
    fontSize: '0.72rem',
    py: 0.6,
    px: 1,
  } as const;

  return (
    <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
      {/* ── Toggle header ─────────────────────────────────────────────────── */}
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 0.9,
          cursor: 'pointer',
          userSelect: 'none',
          '&:hover': {
            backgroundColor: alpha(theme.palette.grey[500], 0.04),
          },
        }}
      >
        <TableRowsIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            fontSize: '0.65rem',
            letterSpacing: '0.6px',
            color: 'text.disabled',
            textTransform: 'uppercase',
          }}
        >
          {open ? 'Hide Data Log' : 'Show Data Log'}
        </Typography>

        {/* Counts */}
        <Box sx={{ display: 'flex', gap: 0.5, ml: 0.5 }}>
          <Chip
            label={`${sortedEvents.length} events`}
            size="small"
            sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600 }}
          />
          <Chip
            label={`${sortedVitals.length} vitals`}
            size="small"
            sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600 }}
          />
        </Box>

        <KeyboardArrowDownIcon
          sx={{
            fontSize: '0.9rem',
            color: 'text.disabled',
            ml: 'auto',
            transition: 'transform 0.2s',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}
        />
      </Box>

      {/* ── Collapsible body ──────────────────────────────────────────────── */}
      <Collapse in={open} timeout={250}>
        <Box sx={{ px: 2, pb: 2 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              mb: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
              minHeight: 36,
              '& .MuiTab-root': { minHeight: 36 },
            }}
          >
            <Tab label={`Events (${sortedEvents.length})`} sx={{ fontSize: '0.72rem' }} />
            <Tab label={`Vital Signs (${sortedVitals.length})`} sx={{ fontSize: '0.72rem' }} />
          </Tabs>

          {/* ── Events table ─────────────────────────────────────────────── */}
          {tab === 0 && (
            <TableContainer sx={{ maxHeight: 300, overflow: 'auto', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={th}>Time</TableCell>
                    <TableCell sx={th}>Type</TableCell>
                    <TableCell sx={th}>Title</TableCell>
                    <TableCell sx={th}>Details</TableCell>
                    <TableCell sx={th}>Logged By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedEvents.map((ev) => (
                    <TableRow key={ev.id} hover>
                      <TableCell sx={{ ...td, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                        {fmtTime(ev.timestamp)}
                      </TableCell>
                      <TableCell sx={td}>
                        <Chip
                          label={ev.type}
                          size="small"
                          sx={{
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            height: 18,
                            backgroundColor: alpha(ev.color || '#9e9e9e', 0.12),
                            color: ev.color || '#9e9e9e',
                            border: `1px solid ${alpha(ev.color || '#9e9e9e', 0.3)}`,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ ...td, fontWeight: 600 }}>{ev.title}</TableCell>
                      <TableCell sx={{ ...td, color: 'text.secondary', maxWidth: 220 }}>
                        {ev.details || <span style={{ color: theme.palette.text.disabled }}>—</span>}
                      </TableCell>
                      <TableCell sx={{ ...td, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                        {ev.createdBy || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {sortedEvents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 3, color: 'text.disabled', fontSize: '0.75rem' }}>
                        No events recorded
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* ── Vital Signs table ─────────────────────────────────────────── */}
          {tab === 1 && (
            <TableContainer sx={{ maxHeight: 300, overflow: 'auto', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={th}>Time</TableCell>
                    <TableCell sx={{ ...th, color: '#E53935' }}>HR</TableCell>
                    <TableCell sx={{ ...th, color: '#43A047' }}>RR</TableCell>
                    <TableCell sx={{ ...th, color: '#1565C0' }}>SysBP</TableCell>
                    <TableCell sx={{ ...th, color: '#42A5F5' }}>DiaBP</TableCell>
                    <TableCell sx={{ ...th, color: '#7E57C2' }}>MAP</TableCell>
                    <TableCell sx={{ ...th, color: '#00ACC1' }}>SpO₂</TableCell>
                    <TableCell sx={{ ...th, color: '#AB47BC' }}>ETCO₂</TableCell>
                    <TableCell sx={{ ...th, color: '#F57C00' }}>Temp</TableCell>
                    <TableCell sx={{ ...th, color: '#0288D1' }}>O₂</TableCell>
                    <TableCell sx={{ ...th, color: '#8E24AA' }}>Vapor</TableCell>
                    <TableCell sx={th}>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedVitals.map((vs) => {
                    const ts = vs.timestamp instanceof Date ? vs.timestamp : new Date(vs.timestamp);
                    return (
                      <TableRow key={vs.id} hover>
                        <TableCell sx={{ ...td, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                          {fmtTime(ts)}
                        </TableCell>
                        <TableCell sx={td}>{nullStr(vs.heartRate)}</TableCell>
                        <TableCell sx={td}>{nullStr(vs.respiratoryRate)}</TableCell>
                        <TableCell sx={td}>{nullStr(vs.bloodPressure?.systolic)}</TableCell>
                        <TableCell sx={td}>{nullStr(vs.bloodPressure?.diastolic)}</TableCell>
                        <TableCell sx={td}>{nullStr(vs.bloodPressure?.mean)}</TableCell>
                        <TableCell sx={td}>{nullStr(vs.oxygenSaturation)}</TableCell>
                        <TableCell sx={td}>{nullStr(vs.etCO2)}</TableCell>
                        <TableCell sx={{ ...td, whiteSpace: 'nowrap' }}>
                          {vs.temperature ? toF(vs.temperature) : '—'}
                        </TableCell>
                        <TableCell sx={td}>
                          {vs.o2FlowRate != null ? `${vs.o2FlowRate}` : '—'}
                        </TableCell>
                        <TableCell sx={{ ...td, whiteSpace: 'nowrap' }}>
                          {vs.vaporizerPercent != null
                            ? `${vs.vaporizerAgent ?? ''} ${vs.vaporizerPercent}%`.trim()
                            : '—'}
                        </TableCell>
                        <TableCell sx={{ ...td, color: 'text.secondary', maxWidth: 160 }}>
                          {vs.notes || '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {sortedVitals.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={12} sx={{ textAlign: 'center', py: 3, color: 'text.disabled', fontSize: '0.75rem' }}>
                        No vital signs recorded
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default AnesthesiaDataLog;
