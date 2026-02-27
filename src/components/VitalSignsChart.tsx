import React, { useRef, useState, useEffect, useImperativeHandle, useMemo } from 'react';
import { Typography, Button, Box, Paper, useTheme, alpha, IconButton, Collapse, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
} from 'recharts';
import { toPng } from 'html-to-image';
import { VitalSign, Event } from '../types';
import EventForm from './EventForm';
import { getEvents } from '../services/patients';
import {
  CHART_LEFT_MARGIN, CHART_RIGHT_MARGIN, YAXIS_WIDTH,
  PLOT_AREA_LEFT, PLOT_AREA_RIGHT, generate5MinTicks,
} from '../utils/chartConstants';
import { getRangeStatus, RANGE_COLORS, VitalParam } from '../utils/vitalRanges';

// ─── Props & Ref Types ────────────────────────────────────────────────────────

interface VitalSignsChartProps {
  vitalSigns: VitalSign[];
  patientId: string;
  onVisibleRangeChange?: (range: { start: Date; end: Date }) => void;
  timeRange?: { startTime: Date; endTime: Date };
  onVitalSignClick?: (vs: VitalSign) => void;
  /** Events managed externally (PatientDetail). When provided, internal fetch is skipped. */
  externalEvents?: Event[];
  /** Called after an event is added via the Log Event button — lets the parent refresh its list. */
  onEventAdded?: () => void;
  /** Patient species — used for species-aware range checks in the tooltip. */
  species?: string;
  // React 19: ref accepted directly as a prop (forwardRef no longer needed)
  ref?: React.Ref<VitalSignsChartRef>;
}

export interface VitalSignsChartRef {
  getChart: () => null;
  getChartImage: () => Promise<string | undefined>;
  openEventLog: () => void;
}

// ─── Parameter Config ─────────────────────────────────────────────────────────

const PARAMS = {
  hr:    { label: 'HR',     unit: 'bpm',  color: '#E53935' },
  rr:    { label: 'RR',     unit: 'bpm',  color: '#43A047' },
  sysBP: { label: 'SysBP',  unit: 'mmHg', color: '#1565C0' },
  diaBP: { label: 'DiaBP',  unit: 'mmHg', color: '#42A5F5' },
  map:   { label: 'MAP',    unit: 'mmHg', color: '#7E57C2' },
  spo2:  { label: 'SpO₂',  unit: '%',    color: '#00ACC1' },
  etco2: { label: 'ETCO₂', unit: 'mmHg', color: '#AB47BC' },
  temp:  { label: 'Temp',   unit: '°F',   color: '#F57C00' },
  o2:    { label: 'O₂',    unit: 'L/min', color: '#0288D1' },
  vapor: { label: 'Vapor',  unit: '%',    color: '#8E24AA' },
};

// ─── Module-level DataPoint types ────────────────────────────────────────────
// Defined at module level so SpO2Strip and ColumnGrid can reference them.

export type DataPoint = {
  x: number; y: number; unit: string; name: string;
  vitalSignId: string; voided: boolean; edited: boolean;
};

export type VaporPoint = DataPoint & { agent: string };

// ─── Custom SVG Shapes ────────────────────────────────────────────────────────
// Recharts injects cx, cy, fill via React.cloneElement — no hooks used here.

// ─── Voided / Edited decorators ─────────────────────────────────────────────
// Each shape checks `payload.voided` and `payload.edited` from the DataPoint.

/** Small strikethrough line for voided entries */
const VoidStrike = ({ cx, cy }: { cx: number; cy: number }) => (
  <line x1={cx - 7} y1={cy} x2={cx + 7} y2={cy} stroke="#B71C1C" strokeWidth={1.5} />
);

/** Blue indicator dot for edited entries */
const EditDot = ({ cx, cy }: { cx: number; cy: number }) => (
  <circle cx={cx + 5} cy={cy - 5} r={2.5} fill="#0288D1" stroke="white" strokeWidth={0.5} />
);

/** HR — filled circle */
const CircleShape = (props: any) => {
  const { cx, cy, fill, payload } = props;
  if (cx == null || cy == null) return null;
  if (payload?.voided) {
    return (
      <g opacity={0.3}>
        <circle cx={cx} cy={cy} r={5} fill="none" stroke={fill} strokeWidth={1.5} strokeDasharray="2 2" />
        <VoidStrike cx={cx} cy={cy} />
      </g>
    );
  }
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill={fill} stroke="white" strokeWidth={1} />
      {payload?.edited && <EditDot cx={cx} cy={cy} />}
    </g>
  );
};

/** RR — hollow circle */
const RRShape = (props: any) => {
  const { cx, cy, fill, payload } = props;
  if (cx == null || cy == null) return null;
  if (payload?.voided) {
    return (
      <g opacity={0.3}>
        <circle cx={cx} cy={cy} r={5} fill="none" stroke={fill} strokeWidth={1.5} strokeDasharray="2 2" />
        <VoidStrike cx={cx} cy={cy} />
      </g>
    );
  }
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill="none" stroke={fill} strokeWidth={1.5} />
      {payload?.edited && <EditDot cx={cx} cy={cy} />}
    </g>
  );
};

/** Systolic BP — hollow upward triangle with faint range line down to diastolic */
const SysBPShape = (props: any) => {
  const { cx, cy, fill, payload } = props;
  if (cx == null || cy == null) return null;
  const pts = `${cx},${cy - 6} ${cx - 5},${cy + 4} ${cx + 5},${cy + 4}`;
  // pxPerUnit is injected into each data point after the Y-domain is computed,
  // so the connector line scales correctly with the autoscaled axis.
  const pxPerUnit: number = payload?.pxPerUnit ?? 1.88; // 1.88 = fallback for 0–200 domain
  const rangeH =
    payload?.diaValue != null && payload.y > payload.diaValue
      ? (payload.y - payload.diaValue) * pxPerUnit
      : 0;
  if (payload?.voided) {
    return (
      <g opacity={0.3}>
        {rangeH > 0 && (
          <line x1={cx} y1={cy} x2={cx} y2={cy + rangeH} stroke={fill} strokeWidth={1} strokeOpacity={0.3} />
        )}
        <polygon points={pts} fill="none" stroke={fill} strokeWidth={1.5} strokeDasharray="2 2" />
        <VoidStrike cx={cx} cy={cy} />
      </g>
    );
  }
  return (
    <g>
      {rangeH > 0 && (
        <line x1={cx} y1={cy} x2={cx} y2={cy + rangeH} stroke={fill} strokeWidth={1.5} strokeOpacity={0.25} />
      )}
      <polygon points={pts} fill="none" stroke={fill} strokeWidth={1.5} />
      {payload?.edited && <EditDot cx={cx} cy={cy} />}
    </g>
  );
};

/** Diastolic BP — hollow downward triangle */
const DiaBPShape = (props: any) => {
  const { cx, cy, fill, payload } = props;
  if (cx == null || cy == null) return null;
  const pts = `${cx - 5},${cy - 4} ${cx + 5},${cy - 4} ${cx},${cy + 6}`;
  if (payload?.voided) {
    return (
      <g opacity={0.3}>
        <polygon points={pts} fill="none" stroke={fill} strokeWidth={1.5} strokeDasharray="2 2" />
        <VoidStrike cx={cx} cy={cy} />
      </g>
    );
  }
  return (
    <g>
      <polygon points={pts} fill="none" stroke={fill} strokeWidth={1.5} />
      {payload?.edited && <EditDot cx={cx} cy={cy} />}
    </g>
  );
};

/** MAP — cross / plus */
const CrossShape = (props: any) => {
  const { cx, cy, fill, payload } = props;
  if (cx == null || cy == null) return null;
  if (payload?.voided) {
    return (
      <g opacity={0.3}>
        <g fill="none" stroke={fill} strokeWidth={1.5} strokeDasharray="2 2">
          <rect x={cx - 1.5} y={cy - 6} width={3} height={12} />
          <rect x={cx - 6} y={cy - 1.5} width={12} height={3} />
        </g>
        <VoidStrike cx={cx} cy={cy} />
      </g>
    );
  }
  return (
    <g>
      <g fill={fill}>
        <rect x={cx - 1.5} y={cy - 6} width={3} height={12} />
        <rect x={cx - 6} y={cy - 1.5} width={12} height={3} />
      </g>
      {payload?.edited && <EditDot cx={cx} cy={cy} />}
    </g>
  );
};

/** ETCO₂ — filled diamond */
const ETCO2Shape = (props: any) => {
  const { cx, cy, fill, payload } = props;
  if (cx == null || cy == null) return null;
  const pts = `${cx},${cy - 6} ${cx + 5},${cy} ${cx},${cy + 6} ${cx - 5},${cy}`;
  if (payload?.voided) {
    return (
      <g opacity={0.3}>
        <polygon points={pts} fill="none" stroke={fill} strokeWidth={1.5} strokeDasharray="2 2" />
        <VoidStrike cx={cx} cy={cy} />
      </g>
    );
  }
  return (
    <g>
      <polygon points={pts} fill={fill} stroke="white" strokeWidth={0.5} />
      {payload?.edited && <EditDot cx={cx} cy={cy} />}
    </g>
  );
};

// ─── Full Snapshot Tooltip ────────────────────────────────────────────────────
// Defined at module level (no MUI, no hooks) so Recharts can invoke it safely.
// Receives allVitalSigns and species via the render-prop pattern used at the call-site.

interface FullSnapshotTooltipProps {
  active?: boolean;
  payload?: any[];
  allVitalSigns: VitalSign[];
  species: string | undefined;
}

const FullSnapshotTooltip = ({
  active,
  payload,
  allVitalSigns,
  species,
}: FullSnapshotTooltipProps) => {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  // Look up the full VitalSign record so we can show ALL parameters
  const vs = allVitalSigns.find((v) => v.id === point.vitalSignId);
  if (!vs) return null;

  const ts = vs.timestamp instanceof Date ? vs.timestamp : new Date(vs.timestamp);
  const timeStr = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Celsius → Fahrenheit for range check
  const tempF =
    vs.temperature != null && vs.temperature > 10
      ? Math.round(((vs.temperature * 9) / 5 + 32) * 10) / 10
      : null;

  // Vital rows to display
  type Row = { label: string; value: string; param: VitalParam | null; numVal: number | null };
  const rows: Row[] = [
    {
      label: 'HR',
      value: vs.heartRate != null ? `${vs.heartRate} bpm` : '\u2014',
      param: 'hr',
      numVal: vs.heartRate,
    },
    {
      label: 'RR',
      value: vs.respiratoryRate != null ? `${vs.respiratoryRate} brpm` : '\u2014',
      param: 'rr',
      numVal: vs.respiratoryRate,
    },
    {
      label: 'Sys BP',
      value: vs.bloodPressure?.systolic != null ? `${vs.bloodPressure.systolic} mmHg` : '\u2014',
      param: 'sysBP',
      numVal: vs.bloodPressure?.systolic ?? null,
    },
    {
      label: 'Dia BP',
      value: vs.bloodPressure?.diastolic != null ? `${vs.bloodPressure.diastolic} mmHg` : '\u2014',
      param: 'diaBP',
      numVal: vs.bloodPressure?.diastolic ?? null,
    },
    {
      label: 'MAP',
      value: vs.bloodPressure?.mean != null ? `${vs.bloodPressure.mean} mmHg` : '\u2014',
      param: 'map',
      numVal: vs.bloodPressure?.mean ?? null,
    },
    {
      label: 'SpO\u2082',
      value: vs.oxygenSaturation != null ? `${vs.oxygenSaturation}%` : '\u2014',
      param: 'spo2',
      numVal: vs.oxygenSaturation,
    },
    {
      label: 'ETCO\u2082',
      value: vs.etCO2 != null ? `${vs.etCO2} mmHg` : '\u2014',
      param: 'etco2',
      numVal: vs.etCO2,
    },
    {
      label: 'Temp',
      value: tempF != null ? `${tempF}\u00B0F` : '\u2014',
      param: 'tempF',
      numVal: tempF,
    },
  ];

  const isVoided = !!vs.voidedAt;
  const isEdited = (vs.editHistory?.length ?? 0) > 0;

  // Determine dot color for each param
  const dotColor = (param: VitalParam | null, numVal: number | null): string => {
    if (!param || numVal == null) return 'rgba(255,255,255,0.18)';
    return RANGE_COLORS[getRangeStatus(param, numVal, species)];
  };

  return (
    <div
      style={{
        background: 'rgba(10, 20, 45, 0.96)',
        color: '#fff',
        padding: '10px 13px',
        borderRadius: 6,
        fontSize: '0.72rem',
        lineHeight: 1.65,
        boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
        pointerEvents: 'none',
        minWidth: 188,
      }}
    >
      {/* Header: wall-clock time */}
      <div
        style={{
          marginBottom: 7,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: 6,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{timeStr}</span>
      </div>

      {/* Vital parameter rows */}
      {rows.map((row) => (
        <div
          key={row.label}
          style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}
        >
          {/* Status dot */}
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: dotColor(row.param, row.numVal),
              flexShrink: 0,
            }}
          />
          {/* Label */}
          <span
            style={{
              color: 'rgba(255,255,255,0.5)',
              minWidth: 46,
              fontSize: '0.67rem',
            }}
          >
            {row.label}
          </span>
          {/* Value */}
          <span
            style={{
              marginLeft: 'auto',
              paddingLeft: 10,
              fontWeight: row.numVal != null ? 600 : 400,
              color: row.numVal != null ? '#fff' : 'rgba(255,255,255,0.25)',
            }}
          >
            {row.value}
          </span>
        </div>
      ))}

      {/* Footer: voided / edited indicator */}
      {isVoided && (
        <div
          style={{
            marginTop: 7,
            color: '#EF5350',
            fontWeight: 700,
            fontSize: '0.68rem',
            letterSpacing: '0.5px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: 5,
          }}
        >
          VOIDED
        </div>
      )}
      {!isVoided && isEdited && (
        <div
          style={{
            marginTop: 7,
            color: '#29B6F6',
            fontSize: '0.68rem',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: 5,
          }}
        >
          ✏ Edited
        </div>
      )}
    </div>
  );
};

// ─── SpO₂ Strip Chart ─────────────────────────────────────────────────────────
// A narrow AreaChart pinned to 84–101% showing the SpO₂ trend below the main
// scatter chart.  Dots are colored by range status (green / amber / red).
// Reference lines mark the 95% warning threshold and 90% critical threshold.

interface SpO2StripProps {
  spo2Data: DataPoint[];
  xMin: number;
  xMax: number;
  species?: string;
  onVitalSignClick?: (vs: VitalSign) => void;
  vitalSigns: VitalSign[];
}

const SpO2Strip: React.FC<SpO2StripProps> = ({
  spo2Data, xMin, xMax, species, onVitalSignClick, vitalSigns,
}) => {
  const theme = useTheme();

  if (!spo2Data.length) return null;

  return (
    <Box
      sx={{
        position: 'relative',
        borderTop: '1px solid',
        borderColor: 'divider',
        mt: 0,
        pt: '2px',
      }}
    >
      {/* Parameter label — aligned with chart's Y-axis label area */}
      <Box
        sx={{
          position: 'absolute',
          left: 4,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1,
          width: `${PLOT_AREA_LEFT - 8}px`,
          textAlign: 'right',
          pr: 1,
          pointerEvents: 'none',
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: PARAMS.spo2.color, fontWeight: 700, fontSize: '0.65rem', lineHeight: 1.1 }}
        >
          SpO₂ %
        </Typography>
      </Box>

      <ResponsiveContainer width="100%" height={80}>
        <AreaChart
          data={spo2Data}
          margin={{ top: 6, right: CHART_RIGHT_MARGIN, bottom: 4, left: CHART_LEFT_MARGIN }}
        >
          <defs>
            <linearGradient id="spo2AreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={PARAMS.spo2.color} stopOpacity={0.22} />
              <stop offset="95%" stopColor={PARAMS.spo2.color} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="x"
            type="number"
            scale="time"
            domain={[xMin, xMax]}
            hide
          />

          <YAxis
            dataKey="y"
            type="number"
            domain={[84, 101]}
            ticks={[85, 90, 95, 100]}
            tick={{ fontSize: 9 }}
            width={YAXIS_WIDTH}
          />

          <CartesianGrid
            strokeDasharray="3 3"
            stroke={theme.palette.divider}
            vertical={false}
          />

          {/* Warning threshold — 95% */}
          <ReferenceLine
            y={95}
            stroke="#FF9800"
            strokeDasharray="4 3"
            strokeWidth={1}
            label={{ value: '95', position: 'insideBottomLeft', fontSize: 8, fill: '#FF9800', dx: 2, dy: -2 }}
          />

          {/* Critical threshold — 90% */}
          <ReferenceLine
            y={90}
            stroke="#F44336"
            strokeDasharray="4 3"
            strokeWidth={1}
            label={{ value: '90', position: 'insideBottomLeft', fontSize: 8, fill: '#F44336', dx: 2, dy: -2 }}
          />

          <Area
            type="monotone"
            dataKey="y"
            stroke={PARAMS.spo2.color}
            strokeWidth={1.5}
            fill="url(#spo2AreaGradient)"
            isAnimationActive={false}
            dot={(dotProps: any) => {
              const { cx, cy, payload } = dotProps;
              if (cx == null || cy == null) return <g key={cx} />;
              const status = getRangeStatus('spo2', payload.y, species);
              const dc = RANGE_COLORS[status];
              return (
                <circle
                  key={payload.x}
                  cx={cx}
                  cy={cy}
                  r={3.5}
                  fill={dc}
                  stroke="white"
                  strokeWidth={1}
                  style={{ cursor: onVitalSignClick ? 'pointer' : undefined }}
                  onClick={() => {
                    const vs = vitalSigns.find((v) => v.id === payload.vitalSignId);
                    if (vs && onVitalSignClick) onVitalSignClick(vs);
                  }}
                />
              );
            }}
            activeDot={{ r: 5, stroke: PARAMS.spo2.color, fill: 'white', strokeWidth: 2 }}
          />

          {/* Simple tooltip for the SpO₂ strip */}
          <RechartsTooltip
            content={(props: any) => {
              if (!props.active || !props.payload?.length) return null;
              const d = props.payload[0]?.payload;
              if (!d) return null;
              const status = getRangeStatus('spo2', d.y, species);
              return (
                <div
                  style={{
                    background: 'rgba(10,20,45,0.92)',
                    color: '#fff',
                    padding: '5px 9px',
                    borderRadius: 4,
                    fontSize: '0.72rem',
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ color: RANGE_COLORS[status], fontWeight: 700 }}>
                    SpO₂: {d.y}%
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', marginLeft: 8, fontSize: '0.65rem' }}>
                    {new Date(d.x).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            }}
            cursor={{ stroke: alpha(PARAMS.spo2.color, 0.35), strokeWidth: 1, strokeDasharray: '3 3' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

// ─── Timeline-Aligned Row Grid (Temp / O₂ / Vapor) ───────────────────────────
// Values are positioned proportionally along the same X-axis domain as the main
// scatter chart above.  The label column is exactly PLOT_AREA_LEFT wide so its
// right edge lines up with the chart's Y-axis.  Each value pill is placed at
//   left = (timestamp − xMin) / (xMax − xMin) × 100%
// within a position:relative plot area, centering the pill on the data point.
// overflow:hidden clips any pill that falls outside the visible time range.

const GRID_ROW_H = 26; // px — height of each data row

interface ColumnGridProps {
  tempData:   DataPoint[];
  o2Data:     DataPoint[];
  vaporData:  VaporPoint[];
  vitalSigns: VitalSign[];
  onVitalSignClick?: (vs: VitalSign) => void;
  xMin: number;
  xMax: number;
}

const ColumnGrid: React.FC<ColumnGridProps> = ({
  tempData, o2Data, vaporData, vitalSigns, onVitalSignClick, xMin, xMax,
}) => {
  const theme = useTheme();

  const range = xMax - xMin || 1; // guard against divide-by-zero
  const pct = (ts: number) => ((ts - xMin) / range) * 100;

  const handleClick = (vitalSignId: string) => {
    if (!onVitalSignClick) return;
    const vs = vitalSigns.find((v) => v.id === vitalSignId);
    if (vs) onVitalSignClick(vs);
  };

  const ROWS: {
    label: string;
    color: string;
    data: DataPoint[];
    fmt: (pt: DataPoint) => string;
    /** Minimum ms between time-based label pills */
    minLabelMs: number;
    /** If true, also force a pill whenever the value (or agent) changes */
    showOnChange: boolean;
  }[] = [
    {
      label: 'Temp °F',
      color: PARAMS.temp.color,
      data: tempData,
      fmt: (pt) => `${pt.y}°`,
      // Show every ~15 min: with 5-min readings every 3rd point gets a pill.
      minLabelMs: 14 * 60 * 1000,
      showOnChange: false,
    },
    {
      label: 'O₂ L/min',
      color: PARAMS.o2.color,
      data: o2Data,
      fmt: (pt) => `${pt.y}`,
      // 30-min baseline, plus a pill whenever the flow rate changes.
      minLabelMs: 29 * 60 * 1000,
      showOnChange: true,
    },
    {
      label: 'Vapor %',
      color: PARAMS.vapor.color,
      data: vaporData as DataPoint[],
      fmt: (pt) => `${pt.y}%`,
      // 30-min baseline, plus a pill whenever the % or agent changes.
      minLabelMs: 29 * 60 * 1000,
      showOnChange: true,
    },
  ];

  const hasData = ROWS.some((r) => r.data.length > 0);
  if (!hasData) return null;

  return (
    <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 0 }}>
      {ROWS.map((row, rowIdx) => {
        if (!row.data.length) return null;

        // Decide which points get a label pill vs a small dot.
        // A pill appears when:
        //   (a) enough time has elapsed since the last pill (minLabelMs), OR
        //   (b) the value (or vaporizer agent) changed since the last pill (showOnChange rows only).
        // Resetting lastLabelX on every pill keeps the interval relative to the most recent label.
        let lastLabelX   = -Infinity;
        let lastLabelY: number | null = null;
        let lastLabelAgent: string | null = null;

        const annotated = row.data
          .filter((pt) => !pt.voided)
          .map((pt) => {
            const timeElapsed   = pt.x - lastLabelX >= row.minLabelMs;
            const valueChanged  = row.showOnChange && (
              lastLabelY === null ||
              pt.y !== lastLabelY ||
              // Vapor: also fire when the agent name switches
              (row.label === 'Vapor %' && (pt as VaporPoint).agent !== lastLabelAgent)
            );
            const showPill = timeElapsed || valueChanged;
            if (showPill) {
              lastLabelX     = pt.x;
              lastLabelY     = pt.y;
              lastLabelAgent = row.label === 'Vapor %' ? ((pt as VaporPoint).agent ?? null) : null;
            }
            return { pt, showPill };
          });

        return (
          <Box
            key={row.label}
            sx={{
              display: 'flex',
              height: GRID_ROW_H,
              alignItems: 'center',
              borderTop: rowIdx > 0 ? '1px solid' : 'none',
              borderColor: 'divider',
            }}
          >
            {/* Label column — width matches PLOT_AREA_LEFT so it aligns with the Y-axis */}
            <Box
              sx={{
                flexShrink: 0,
                width: PLOT_AREA_LEFT,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                pr: 1,
                borderRight: '1px solid',
                borderColor: 'divider',
                backgroundColor: alpha(theme.palette.background.paper, 1),
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontSize: '0.61rem', fontWeight: 700, color: row.color, whiteSpace: 'nowrap' }}
              >
                {row.label}
              </Typography>
            </Box>

            {/* Plot area — values positioned proportionally along the time axis */}
            <Box
              sx={{
                flexGrow: 1,
                position: 'relative',
                height: '100%',
                overflow: 'hidden',
                pr: `${CHART_RIGHT_MARGIN}px`,
              }}
            >
              {annotated.map(({ pt, showPill }) => {
                const timeStr = new Date(pt.x).toLocaleTimeString([], {
                  hour: '2-digit', minute: '2-digit',
                });

                // ── Tooltip panel — mirrors FullSnapshotTooltip exactly ─────────
                const tipContent = (
                  <Box sx={{ p: '10px 13px', minWidth: 150, pointerEvents: 'none' }}>
                    {/* Time header */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 1,
                        mb: '7px',
                        pb: '6px',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{timeStr}</span>
                    </Box>
                    {/* Value row */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', mb: '2px' }}>
                      {/* Status dot in the row's colour */}
                      <Box
                        sx={{
                          width: 7, height: 7, borderRadius: '50%',
                          backgroundColor: row.color, flexShrink: 0,
                        }}
                      />
                      <span style={{ color: 'rgba(255,255,255,0.5)', minWidth: 46, fontSize: '0.67rem' }}>
                        {row.label}
                      </span>
                      <span style={{ marginLeft: 'auto', paddingLeft: 10, fontWeight: 600, fontSize: '0.72rem' }}>
                        {row.fmt(pt)}
                      </span>
                    </Box>
                  </Box>
                );

                // Shared Tooltip props — dark panel identical to the main chart tooltip
                const sharedTooltipProps = {
                  title: tipContent,
                  placement: 'top' as const,
                  arrow: true,
                  enterDelay: 120,
                  enterNextDelay: 80,
                  slotProps: {
                    tooltip: {
                      sx: {
                        bgcolor: 'rgba(10, 20, 45, 0.96)',
                        color: '#fff',
                        p: 0,
                        borderRadius: '6px',
                        boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
                        fontSize: '0.72rem',
                        lineHeight: 1.65,
                        maxWidth: 260,
                      },
                    },
                    arrow: { sx: { color: 'rgba(10, 20, 45, 0.96)' } },
                  },
                };

                return showPill ? (
                  /* Full label pill — shown at interval threshold OR on value change */
                  <Tooltip key={pt.x} {...sharedTooltipProps}>
                    <Box
                      onClick={() => handleClick(pt.vitalSignId)}
                      sx={{
                        position: 'absolute',
                        left: `${pct(pt.x)}%`,
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        cursor: onVitalSignClick ? 'pointer' : undefined,
                        px: '3px',
                        py: '1px',
                        borderRadius: '3px',
                        backgroundColor: alpha(row.color, 0.09),
                        border: `1px solid ${alpha(row.color, 0.25)}`,
                        '&:hover': { backgroundColor: alpha(row.color, 0.2), borderColor: alpha(row.color, 0.55) },
                        transition: 'background-color 0.12s',
                        whiteSpace: 'nowrap',
                        lineHeight: 1,
                      }}
                    >
                      <Typography
                        component="span"
                        sx={{ fontSize: '0.61rem', fontWeight: 700, color: row.color, lineHeight: 1 }}
                      >
                        {row.fmt(pt)}
                      </Typography>
                    </Box>
                  </Tooltip>
                ) : (
                  /* Small dot — tooltip is the only way to read the value */
                  <Tooltip key={pt.x} {...sharedTooltipProps}>
                    <Box
                      onClick={() => handleClick(pt.vitalSignId)}
                      sx={{
                        position: 'absolute',
                        left: `${pct(pt.x)}%`,
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: alpha(row.color, 0.45),
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: row.color,
                          transform: 'translate(-50%, -50%) scale(1.5)',
                        },
                        transition: 'background-color 0.12s, transform 0.12s',
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

// ─── Mini Symbol (legend) ─────────────────────────────────────────────────────

type ShapeKey = 'circle' | 'circle-open' | 'triangle-up-open' | 'triangle-down-open' | 'cross' | 'diamond' | 'spo2-strip';

const MiniSymbol: React.FC<{ shape: ShapeKey; color: string }> = ({ shape, color }) => {
  const cx = 8, cy = 8;
  switch (shape) {
    case 'circle':
      return <circle cx={cx} cy={cy} r={5} fill={color} />;
    case 'circle-open':
      return <circle cx={cx} cy={cy} r={5} fill="none" stroke={color} strokeWidth={1.5} />;
    case 'triangle-up-open':
      return <polygon points={`${cx},${cy - 6} ${cx - 5},${cy + 4} ${cx + 5},${cy + 4}`} fill="none" stroke={color} strokeWidth={1.5} />;
    case 'triangle-down-open':
      return <polygon points={`${cx - 5},${cy - 4} ${cx + 5},${cy - 4} ${cx},${cy + 6}`} fill="none" stroke={color} strokeWidth={1.5} />;
    case 'cross':
      return (
        <g fill={color}>
          <rect x={cx - 1.5} y={cy - 6} width={3} height={12} />
          <rect x={cx - 6} y={cy - 1.5} width={12} height={3} />
        </g>
      );
    case 'diamond':
      return <polygon points={`${cx},${cy - 6} ${cx + 5},${cy} ${cx},${cy + 6} ${cx - 5},${cy}`} fill={color} />;
    case 'spo2-strip':
      // A short horizontal line to represent the strip chart
      return <line x1={2} y1={cy} x2={14} y2={cy} stroke={color} strokeWidth={2} strokeLinecap="round" />;
    default:
      return <circle cx={cx} cy={cy} r={5} fill={color} />;
  }
};

const LEGEND_ITEMS: { shape: ShapeKey; param: keyof typeof PARAMS }[] = [
  { shape: 'circle',              param: 'hr'    },
  { shape: 'circle-open',         param: 'rr'    },
  { shape: 'triangle-up-open',    param: 'sysBP' },
  { shape: 'triangle-down-open',  param: 'diaBP' },
  { shape: 'cross',               param: 'map'   },
  { shape: 'diamond',             param: 'etco2' },
  // SpO₂ is no longer in the main scatter chart — shown in the strip below
  { shape: 'spo2-strip',          param: 'spo2'  },
];

// ─── Event reference line tooltip ────────────────────────────────────────────
// Defined at module level (not inside the component) so Babel's JSX transform
// can process it cleanly without scope confusion.

export type EventTooltipState = { ev: Event; cx: number; cy: number } | null;

interface EventRefLabelProps {
  viewBox?: { x: number; y: number; width: number; height: number };
  ev: Event;
  labelText: string;
  onHover: (ev: Event, cx: number, cy: number) => void;
  onLeave: () => void;
  onToggle: (ev: Event, cx: number, cy: number) => void;
}

/** Interactive pill label rendered inside Recharts' SVG reference lines. */
const EventRefLabel = ({ viewBox, ev, labelText, onHover, onLeave, onToggle }: EventRefLabelProps) => {
  const px = viewBox?.x ?? 0;
  const py = viewBox?.y ?? 0;
  const color = ev.color || '#78909C';
  const charW = 6.2;
  const pad = 6;
  const w = Math.max(labelText.length * charW + pad * 2, 22);
  const h = 14;
  const rectY = py - h - 3; // just above the plot area top edge

  return (
    <g
      onMouseEnter={(e) => onHover(ev, e.clientX, e.clientY)}
      onMouseLeave={onLeave}
      onClick={(e) => onToggle(ev, e.clientX, e.clientY)}
      style={{ cursor: 'pointer', pointerEvents: 'all' }}
    >
      {/* Pill background */}
      <rect x={px - w / 2} y={rectY} width={w} height={h} rx={3} fill={color} opacity={0.92} />
      {/* Label text — pointer-events:none so the <g> captures events */}
      <text
        x={px}
        y={rectY + h / 2 + 3.5}
        textAnchor="middle"
        fontSize={9}
        fontWeight={700}
        fill="white"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {labelText}
      </text>
    </g>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
// React 19: ref is accepted as a plain prop — no forwardRef wrapper needed.

export const VitalSignsChart = ({
  vitalSigns,
  patientId,
  onVisibleRangeChange,
  timeRange,
  onVitalSignClick,
  externalEvents,
  onEventAdded,
  species,
  ref,
}: VitalSignsChartProps) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [showLegend, setShowLegend] = useState(true);

  // ── Ref API ───────────────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    getChart: () => null,
    openEventLog: () => setIsEventFormOpen(true),
    getChartImage: (): Promise<string | undefined> =>
      new Promise((resolve) => {
        setTimeout(async () => {
          if (!containerRef.current) { resolve(undefined); return; }
          try {
            const dataUrl = await toPng(containerRef.current, {
              backgroundColor: '#ffffff',
              pixelRatio: 2,
            });
            resolve(dataUrl);
          } catch (e) {
            console.error('Error capturing chart image:', e);
            resolve(undefined);
          }
        }, 200);
      }),
  }));

  // ── Load events ───────────────────────────────────────────────────────────
  // When externalEvents are provided (from PatientDetail), skip the internal
  // fetch and keep the chart in sync with a single source of truth.
  useEffect(() => {
    if (externalEvents !== undefined) {
      setEvents(externalEvents);
      return;
    }
    let cancelled = false;
    getEvents(patientId)
      .then((data) => { if (!cancelled) setEvents(data); })
      .catch((err) => console.error('Error loading events:', err));
    return () => { cancelled = true; };
  }, [patientId, externalEvents]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const toF = (c: number) => Math.round(((c * 9) / 5 + 32) * 10) / 10;

  const makePoints = (
    fn: (vs: VitalSign) => number | null | undefined,
    unit: string,
    name: string,
  ): DataPoint[] =>
    vitalSigns
      .map((vs): DataPoint | null => {
        const ts = vs.timestamp instanceof Date ? vs.timestamp : new Date(vs.timestamp);
        const val = fn(vs);
        if (isNaN(ts.getTime()) || val == null || isNaN(Number(val))) return null;
        return {
          x: ts.getTime(), y: Math.round(Number(val) * 10) / 10, unit, name,
          vitalSignId: vs.id,
          voided: !!vs.voidedAt,
          edited: (vs.editHistory?.length ?? 0) > 0,
        };
      })
      .filter((p): p is DataPoint => p !== null)
      .sort((a, b) => a.x - b.x);

  // ── Data sets ─────────────────────────────────────────────────────────────
  // 0 is used as a sentinel value when a field was left blank on entry — filter these out.
  const hrData    = makePoints((vs) => (vs.heartRate > 0 ? vs.heartRate : null),                       'bpm',  'Heart Rate');
  const rrData    = makePoints((vs) => (vs.respiratoryRate > 0 ? vs.respiratoryRate : null),           'bpm',  'Resp Rate');

  // Build sysBP base (diaValue only) — pxPerUnit is added after the domain is computed
  const sysBPBase = makePoints((vs) => (vs.bloodPressure?.systolic  > 0 ? vs.bloodPressure.systolic  : null), 'mmHg', 'Systolic BP')
    .map((pt) => {
      const matchVs = vitalSigns.find((vs) => {
        const ts = vs.timestamp instanceof Date ? vs.timestamp : new Date(vs.timestamp);
        return ts.getTime() === pt.x;
      });
      return { ...pt, diaValue: matchVs?.bloodPressure?.diastolic ?? null };
    });
  const diaBPData = makePoints((vs) => (vs.bloodPressure?.diastolic > 0 ? vs.bloodPressure.diastolic : null), 'mmHg', 'Diastolic BP');
  const mapData   = makePoints((vs) => (vs.bloodPressure?.mean  != null && vs.bloodPressure.mean  > 0 ? vs.bloodPressure.mean  : null), 'mmHg', 'MAP');

  // SpO₂ — now shown in the dedicated strip chart below (NOT the main scatter)
  const spo2Data  = makePoints(
    (vs) => (vs.oxygenSaturation > 0 ? vs.oxygenSaturation : null),
    '%', 'SpO₂',
  );

  const etco2Data = makePoints((vs) => (vs.etCO2 != null && vs.etCO2 > 0 ? vs.etCO2 : null), 'mmHg', 'ETCO₂');

  // ── Autoscale Y domain ────────────────────────────────────────────────────
  // Gather every Y value plotted on the main scatter chart (SpO₂ lives on its
  // own strip chart and is excluded). Pad by 10 % of the spread (min 10 units),
  // then snap to multiples of 5 so tick labels stay clean.
  const CHART_H    = 420;
  const MARGIN_TOP = 20;
  const MARGIN_BOT = 24;

  const allMainY = [
    ...hrData, ...rrData, ...sysBPBase, ...diaBPData, ...mapData, ...etco2Data,
  ].map((p) => p.y);

  let yMin = 0, yMax = 200;
  if (allMainY.length > 0) {
    const rawMin = Math.min(...allMainY);
    const rawMax = Math.max(...allMainY);
    const pad    = Math.max(10, Math.round((rawMax - rawMin) * 0.1));
    yMin = Math.max(0, Math.floor((rawMin - pad) / 5) * 5);
    yMax = Math.ceil((rawMax + pad) / 5) * 5;
  }

  const yRange      = yMax - yMin || 1;
  const yPxPerUnit  = (CHART_H - MARGIN_TOP - MARGIN_BOT) / yRange;

  // Tick step: 5 for a narrow range, 10, 25, or 50 for wider spreads
  const tickStep = yRange <= 50 ? 5 : yRange <= 100 ? 10 : yRange <= 250 ? 25 : 50;
  const yTicks: number[] = [];
  for (let t = Math.ceil(yMin / tickStep) * tickStep; t <= yMax; t += tickStep) {
    yTicks.push(t);
  }

  // Inject pxPerUnit into sysBP points so SysBPShape draws the connector correctly
  const sysBPData = sysBPBase.map((pt) => ({ ...pt, pxPerUnit: yPxPerUnit }));

  // Temp: temperature === 0 is a sentinel for "not recorded this interval"
  const tempData  = makePoints(
    (vs) => (vs.temperature > 10 ? toF(vs.temperature) : null),
    '°F', 'Temp',
  );

  const o2Data    = makePoints((vs) => vs.o2FlowRate ?? null, 'L/min', 'O₂ Flow');

  // Vaporizer: need agent name + percent — build a special data set
  const vaporData: VaporPoint[] = vitalSigns
    .map((vs): VaporPoint | null => {
      const ts = vs.timestamp instanceof Date ? vs.timestamp : new Date(vs.timestamp);
      if (isNaN(ts.getTime()) || !vs.vaporizerAgent || vs.vaporizerPercent == null) return null;
      return {
        x: ts.getTime(),
        y: Math.round(Number(vs.vaporizerPercent) * 10) / 10,
        unit: '%',
        name: 'Vaporizer',
        agent: vs.vaporizerAgent,
        vitalSignId: vs.id,
        voided: !!vs.voidedAt,
        edited: (vs.editHistory?.length ?? 0) > 0,
      };
    })
    .filter((p): p is VaporPoint => p !== null)
    .sort((a, b) => a.x - b.x);

  // ── Time domain ───────────────────────────────────────────────────────────
  const getTimeDomain = (): [number, number] => {
    if (timeRange?.startTime && timeRange?.endTime) {
      const s = timeRange.startTime instanceof Date ? timeRange.startTime : new Date(timeRange.startTime);
      const e = timeRange.endTime instanceof Date ? timeRange.endTime : new Date(timeRange.endTime);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) return [s.getTime(), e.getTime()];
    }
    const allX = [
      ...hrData, ...rrData, ...sysBPData, ...diaBPData,
      ...spo2Data, ...etco2Data, ...tempData,
    ].map((p) => p.x);
    if (allX.length > 0) return [Math.min(...allX), Math.max(...allX)];
    const now = Date.now();
    return [now - 3_600_000, now];
  };

  const [xMin, xMax] = getTimeDomain();

  const formatXTick = (ms: number) =>
    new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // ── Event reference lines ─────────────────────────────────────────────────

  /** Short label for a reference line */
  const eventLineLabel = (ev: Event): string => {
    const t = ev.title.toLowerCase();
    if (t.includes('induction'))                                                       return 'IND';
    if (t.includes('premedication') || t.includes('premed') || t.includes('pre-med')) return 'PRE';
    if (t.includes('recovery') || t.includes('end anesthesia'))                        return 'REC';
    if (t.includes('extubation'))                                                       return 'EXT';
    if (t.includes('surgery start'))                                                    return 'S.ST';
    if (t.includes('surgery end'))                                                      return 'S.EN';
    if (t.includes('desaturation') || t.includes('spo'))                               return 'SpO₂';
    // Generic fallback — shorten the type name
    if (ev.type === 'Checkpoint') return 'CHK';
    if (ev.type === 'Procedure')  return 'PRO';
    return 'NOTE';
  };

  // ── Hover tooltip state for event reference lines ────────────────────────
  const [eventTooltip, setEventTooltip] = useState<EventTooltipState>(null);

  const eventLines = events.map((ev) => {
    const t = ev.timestamp instanceof Date ? ev.timestamp : new Date(ev.timestamp);
    if (isNaN(t.getTime())) return null;
    const label = eventLineLabel(ev);
    return (
      <ReferenceLine
        key={ev.id}
        x={t.getTime()}
        stroke={ev.color || '#78909C'}
        strokeWidth={1.5}
        strokeDasharray="4 3"
        label={
          <EventRefLabel
            ev={ev}
            labelText={label}
            onHover={(e, cx, cy) => setEventTooltip({ ev: e, cx, cy })}
            onLeave={() => {
              // Small delay prevents flicker when the cursor moves from <g> to child
              setTimeout(() => setEventTooltip((prev) => (prev?.ev.id === ev.id ? null : prev)), 80);
            }}
            onToggle={(e, cx, cy) => {
              setEventTooltip((prev) => (prev?.ev.id === e.id ? null : { ev: e, cx, cy }));
            }}
          />
        }
      />
    );
  });

  const hasAnyData = vitalSigns.length > 0;

  // ── Click handler: find the VitalSign behind a DataPoint and call back ──
  const handlePointClick = (data: any) => {
    if (!onVitalSignClick) return;
    const vsId = data?.payload?.vitalSignId ?? data?.vitalSignId;
    if (!vsId) return;
    const vs = vitalSigns.find((v) => v.id === vsId);
    if (vs) onVitalSignClick(vs);
  };

  // ── 5-minute tick values for the X-axis ─────────────────────────────────
  const fiveMinTicks = generate5MinTicks(xMin, xMax);

  // ── Event tooltip time formatter ─────────────────────────────────────────
  const fmtEventTime = (ts: Date | string) => {
    const d = ts instanceof Date ? ts : new Date(ts);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  // ── Grid data presence ────────────────────────────────────────────────────
  const hasGridData = tempData.length > 0 || o2Data.length > 0 || vaporData.length > 0;

  return (
    <>
      {/* ── Floating event tooltip (rendered outside chart box to avoid clipping) */}
      {eventTooltip && (
        <Paper
          elevation={6}
          sx={{
            position: 'fixed',
            left: eventTooltip.cx + 14,
            top: eventTooltip.cy - 12,
            zIndex: 1500,
            p: 1.5,
            maxWidth: 260,
            pointerEvents: 'none',
            borderLeft: `3px solid ${eventTooltip.ev.color || '#78909C'}`,
            borderRadius: '4px',
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, display: 'block', fontSize: '0.78rem', lineHeight: 1.4 }}
          >
            {eventTooltip.ev.title}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', display: 'block', fontSize: '0.68rem', lineHeight: 1.4 }}
          >
            {fmtEventTime(eventTooltip.ev.timestamp)} {'\u00B7'} {eventTooltip.ev.type}
          </Typography>
          {eventTooltip.ev.details && (
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mt: 0.5, fontSize: '0.68rem', lineHeight: 1.4 }}
            >
              {eventTooltip.ev.details}
            </Typography>
          )}
          {eventTooltip.ev.createdBy && (
            <Typography
              variant="caption"
              sx={{ color: 'text.disabled', display: 'block', mt: 0.5, fontSize: '0.65rem', lineHeight: 1.3 }}
            >
              By: {eventTooltip.ev.createdBy}
            </Typography>
          )}
        </Paper>
      )}

    <Box ref={containerRef} sx={{ backgroundColor: 'background.paper' }}>

      {/* Thin border + a few px of breathing room for reference line labels */}
      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: '10px' }} />

      {!hasAnyData ? (
        <Typography sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          No vital signs recorded yet.
        </Typography>
      ) : (
        <>
          {/* ── Main scatter chart (HR, RR, BP, MAP, ETCO₂) ─────────────── */}
          {/* SpO₂ has been moved to the dedicated strip chart below.         */}
          <ResponsiveContainer width="100%" height={420}>
            <ScatterChart margin={{ top: 20, right: CHART_RIGHT_MARGIN, bottom: 24, left: CHART_LEFT_MARGIN }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />

              <XAxis
                dataKey="x"
                type="number"
                scale="time"
                domain={[xMin, xMax]}
                tickFormatter={formatXTick}
                tick={{ fontSize: 11 }}
                ticks={fiveMinTicks}
              />

              {/* Single Y-axis — autoscaled to the visible data */}
              <YAxis
                type="number"
                dataKey="y"
                domain={[yMin, yMax]}
                ticks={yTicks}
                tick={{ fontSize: 11 }}
                width={YAXIS_WIDTH}
              />

              {/* Medication / procedure event markers */}
              {eventLines}

              <RechartsTooltip
                content={(props: any) => (
                  <FullSnapshotTooltip
                    {...props}
                    allVitalSigns={vitalSigns}
                    species={species}
                  />
                )}
                cursor={{ stroke: alpha(theme.palette.primary.main, 0.4), strokeWidth: 1, strokeDasharray: '3 3' }}
              />

              {/* ── Data series (clickable) ──────────────────────────── */}
              <Scatter name="HR (bpm)"       data={hrData}    fill={PARAMS.hr.color}    shape={<CircleShape />}  isAnimationActive={false} onClick={handlePointClick} cursor={onVitalSignClick ? 'pointer' : undefined} />
              <Scatter name="RR (bpm)"       data={rrData}    fill={PARAMS.rr.color}    shape={<RRShape />}      isAnimationActive={false} onClick={handlePointClick} cursor={onVitalSignClick ? 'pointer' : undefined} />
              <Scatter name="SysBP (mmHg)"   data={sysBPData} fill={PARAMS.sysBP.color} shape={<SysBPShape />}   isAnimationActive={false} onClick={handlePointClick} cursor={onVitalSignClick ? 'pointer' : undefined} />
              <Scatter name="DiaBP (mmHg)"   data={diaBPData} fill={PARAMS.diaBP.color} shape={<DiaBPShape />}   isAnimationActive={false} onClick={handlePointClick} cursor={onVitalSignClick ? 'pointer' : undefined} />
              {mapData.length > 0 && (
                <Scatter name="MAP (mmHg)"   data={mapData}   fill={PARAMS.map.color}   shape={<CrossShape />}   isAnimationActive={false} onClick={handlePointClick} cursor={onVitalSignClick ? 'pointer' : undefined} />
              )}
              {etco2Data.length > 0 && (
                <Scatter name="ETCO₂ (mmHg)" data={etco2Data} fill={PARAMS.etco2.color} shape={<ETCO2Shape />}   isAnimationActive={false} onClick={handlePointClick} cursor={onVitalSignClick ? 'pointer' : undefined} />
              )}
            </ScatterChart>
          </ResponsiveContainer>

          {/* ── SpO₂ strip chart (84–101% scale, color-coded dots) ─────── */}
          <SpO2Strip
            spo2Data={spo2Data}
            xMin={xMin}
            xMax={xMax}
            species={species}
            onVitalSignClick={onVitalSignClick}
            vitalSigns={vitalSigns}
          />

          {/* ── Timeline row grid: Temp / O₂ Flow / Vaporizer ───────────── */}
          {hasGridData && (
            <ColumnGrid
              tempData={tempData}
              o2Data={o2Data}
              vaporData={vaporData}
              vitalSigns={vitalSigns}
              onVitalSignClick={onVitalSignClick}
              xMin={xMin}
              xMax={xMax}
            />
          )}

          {/* ── Compact symbol key legend ────────────────────────────────── */}
          <Box sx={{ mt: 0.5 }}>
            {/* Header row — always visible, acts as toggle */}
            <Box
              onClick={() => setShowLegend((v) => !v)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1.5,
                py: 0.25,
                cursor: 'pointer',
                userSelect: 'none',
                borderRadius: 1,
                '&:hover': { backgroundColor: alpha(theme.palette.grey[500], 0.06) },
              }}
            >
              <KeyboardArrowDownIcon
                sx={{
                  fontSize: '0.9rem',
                  color: 'text.disabled',
                  transition: 'transform 0.2s',
                  transform: showLegend ? 'rotate(0deg)' : 'rotate(-90deg)',
                }}
              />
              <Typography
                variant="caption"
                sx={{ color: 'text.disabled', fontWeight: 600, fontSize: '0.62rem', letterSpacing: '0.5px' }}
              >
                SYMBOL KEY
              </Typography>
            </Box>

            {/* Collapsible legend body */}
            <Collapse in={showLegend} timeout={200}>
              <Box
                sx={{
                  px: 1.5,
                  py: 0.5,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '3px 10px',
                  alignItems: 'center',
                }}
              >
                {/* Scatter-plot symbols + SpO₂ strip line */}
                {LEGEND_ITEMS.map(({ shape, param }) => {
                  const p = PARAMS[param];
                  return (
                    <Box key={param} sx={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <svg width={16} height={16} viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
                        <MiniSymbol shape={shape} color={p.color} />
                      </svg>
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', lineHeight: 1.2 }}>
                        {p.label}{param === 'spo2' ? ' (strip)' : ''}
                      </Typography>
                    </Box>
                  );
                })}

                {/* Thin separator */}
                <Box sx={{ width: '1px', height: 12, backgroundColor: theme.palette.divider, mx: 0.25 }} />

                {/* Grid row annotation indicators */}
                {[
                  { param: PARAMS.temp,  label: 'Temp' },
                  { param: PARAMS.o2,    label: 'O₂' },
                  { param: PARAMS.vapor, label: 'Vapor' },
                ].map(({ param, label }) => (
                  <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Box
                      sx={{
                        width: 10, height: 10, borderRadius: '2px',
                        backgroundColor: alpha(param.color, 0.25),
                        border: `1.5px solid ${param.color}`,
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', lineHeight: 1.2 }}>
                      {label}
                    </Typography>
                  </Box>
                ))}

                {/* Thin separator */}
                <Box sx={{ width: '1px', height: 12, backgroundColor: theme.palette.divider, mx: 0.25 }} />

                {/* Range status color legend */}
                {[
                  { color: '#4CAF50', label: 'Normal' },
                  { color: '#FF9800', label: 'Warning (<95%)' },
                  { color: '#F44336', label: 'Critical (<90%)' },
                ].map(({ color, label }) => (
                  <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', lineHeight: 1.2 }}>
                      {label}
                    </Typography>
                  </Box>
                ))}

                {/* Thin separator */}
                <Box sx={{ width: '1px', height: 12, backgroundColor: theme.palette.divider, mx: 0.25 }} />

                {/* Voided legend entry */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <svg width={12} height={12} viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
                    <circle cx={8} cy={8} r={5} fill="none" stroke="#999" strokeWidth={1.5} strokeDasharray="2 2" opacity={0.5} />
                    <line x1={3} y1={8} x2={13} y2={8} stroke="#B71C1C" strokeWidth={1.5} opacity={0.6} />
                  </svg>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', lineHeight: 1.2 }}>
                    Voided
                  </Typography>
                </Box>

                {/* Edited legend entry */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <svg width={12} height={12} viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
                    <circle cx={7} cy={9} r={4} fill="#999" />
                    <circle cx={11} cy={5} r={2.5} fill="#0288D1" stroke="white" strokeWidth={0.5} />
                  </svg>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', lineHeight: 1.2 }}>
                    Edited
                  </Typography>
                </Box>
              </Box>
            </Collapse>
          </Box>
        </>
      )}

      {/* ── Event Form ──────────────────────────────────────────────────────── */}
      <EventForm
        open={isEventFormOpen}
        onClose={() => setIsEventFormOpen(false)}
        patientId={patientId}
        onEventAdded={async () => {
          // Always notify parent (keeps PatientDetail's event list fresh, which
          // feeds back via externalEvents prop — covers ProcedureTimer too)
          onEventAdded?.();
          // If running in standalone mode (no externalEvents), refresh internally
          if (externalEvents === undefined) {
            try {
              const updated = await getEvents(patientId);
              setEvents(updated);
            } catch (err) {
              console.error('Error refreshing events:', err);
            }
          }
        }}
        initialTimestamp={new Date()}
      />
    </Box>
    </>
  );
};
