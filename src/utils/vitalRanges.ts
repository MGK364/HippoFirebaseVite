/**
 * Species-aware intra-operative vital sign reference ranges
 * for veterinary anesthesia monitoring.
 *
 * Three-tier status system:
 *   normal   — value is within acceptable intra-op range
 *   warning  — value is borderline / warrants closer monitoring
 *   critical — value is outside safe limits / immediate attention required
 *
 * Backwards-compatible with QuickVitalSignEntry's string-key API:
 *   getRangeStatus('heartRate', prevValue)
 *   getRangeTooltip('heartRate', prevValue)
 *
 * Species-aware API used by VitalSignsChart and VitalSignActionDialog:
 *   getRangeStatus('hr', value, 'Canine')
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type RangeStatus = 'normal' | 'warning' | 'critical';

export type VitalParam =
  | 'hr'
  | 'rr'
  | 'tempF'
  | 'sysBP'
  | 'diaBP'
  | 'map'
  | 'spo2'
  | 'etco2';

// ── Colors ────────────────────────────────────────────────────────────────────

export const RANGE_COLORS: Record<RangeStatus, string> = {
  normal:   '#4CAF50', // green
  warning:  '#FF9800', // amber
  critical: '#F44336', // red
};

// ── Range table ───────────────────────────────────────────────────────────────

/**
 * Threshold pairs:
 *   critLow / warnLow  — lower critical / lower warning boundary
 *   warnHigh / critHigh — upper warning / upper critical boundary
 *
 * null means "no limit" for that boundary.
 * Ranges are intra-operative (anaesthetised patient).
 */
interface RangeDef {
  critLow:  number | null;
  warnLow:  number | null;
  warnHigh: number | null;
  critHigh: number | null;
}

type SpeciesRanges = Record<VitalParam, RangeDef>;

const CANINE: SpeciesRanges = {
  hr:    { critLow: 40,  warnLow: 60,  warnHigh: 120,  critHigh: 180   },
  rr:    { critLow: 6,   warnLow: 10,  warnHigh: 24,   critHigh: 35    },
  tempF: { critLow: 97,  warnLow: 99,  warnHigh: 103,  critHigh: 104.5 },
  sysBP: { critLow: 80,  warnLow: 90,  warnHigh: 160,  critHigh: 200   },
  diaBP: { critLow: 40,  warnLow: 50,  warnHigh: 110,  critHigh: 140   },
  map:   { critLow: 50,  warnLow: 60,  warnHigh: 110,  critHigh: 140   },
  spo2:  { critLow: 90,  warnLow: 95,  warnHigh: null, critHigh: null  },
  etco2: { critLow: 25,  warnLow: 35,  warnHigh: 50,   critHigh: 60    },
};

/** Feline values that differ from canine — rest are inherited */
const FELINE: SpeciesRanges = {
  ...CANINE,
  hr: { critLow: 80,  warnLow: 100, warnHigh: 180, critHigh: 240 },
  rr: { critLow: 8,   warnLow: 12,  warnHigh: 30,  critHigh: 40  },
};

// ── Legacy string-key → VitalParam mapping ────────────────────────────────────
// Supports QuickVitalSignEntry's original string-key API.

const OLD_KEY_MAP: Record<string, VitalParam> = {
  temperature:      'tempF',
  heartRate:        'hr',
  respiratoryRate:  'rr',
  systolic:         'sysBP',
  diastolic:        'diaBP',
  meanPressure:     'map',
  oxygenSaturation: 'spo2',
  etCO2:            'etco2',
};

// ── All recognised VitalParam keys (for runtime guard) ────────────────────────

const VALID_PARAMS = new Set<string>(['hr', 'rr', 'tempF', 'sysBP', 'diaBP', 'map', 'spo2', 'etco2']);

// ── Internal helpers ──────────────────────────────────────────────────────────

function getRangeDef(param: VitalParam, species: string | undefined): RangeDef | undefined {
  const s = (species ?? '').toLowerCase();
  const table = (s.includes('cat') || s.includes('feline') || s.includes('fel')) ? FELINE : CANINE;
  return table[param]; // returns undefined for unrecognised params — callers must guard
}

function getStatus(param: VitalParam, value: number, species: string | undefined): RangeStatus {
  const def = getRangeDef(param, species);
  if (!def) return 'normal'; // unknown param → no range defined
  const { critLow, warnLow, warnHigh, critHigh } = def;
  if (critLow  !== null && value < critLow)  return 'critical';
  if (critHigh !== null && value > critHigh) return 'critical';
  if (warnLow  !== null && value < warnLow)  return 'warning';
  if (warnHigh !== null && value > warnHigh) return 'warning';
  return 'normal';
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Return the RangeStatus for a vital parameter.
 *
 * Accepts either:
 *   - New API: getRangeStatus('hr', 80, 'Canine')
 *   - Legacy API: getRangeStatus('heartRate', 80)
 *
 * Temperature values must be in °F.
 * Returns 'normal' if value is null/undefined/NaN.
 */
export function getRangeStatus(
  paramOrKey: VitalParam | string,
  value: number | null | undefined,
  species?: string,
): RangeStatus {
  if (value == null || isNaN(value as number)) return 'normal';
  // Resolve legacy string keys; fall back to treating as VitalParam directly
  const param = (OLD_KEY_MAP[paramOrKey] ?? paramOrKey) as string;
  // Guard: if the resolved key is not a recognised VitalParam, no range is defined
  if (!VALID_PARAMS.has(param)) return 'normal';
  return getStatus(param as VitalParam, value as number, species);
}

/**
 * Return a human-readable tooltip string for a vital field.
 * Used by QuickVitalSignEntry's legacy API: getRangeTooltip('heartRate', 55)
 *
 * Returns an empty string when the value is within normal range.
 */
export function getRangeTooltip(
  rangeKey: string,
  value: number | null | undefined,
): string {
  if (value == null) return '';
  const param = OLD_KEY_MAP[rangeKey];
  if (!param) return ''; // unrecognised key (e.g. o2FlowRate, vaporizerPercent)
  const def = getRangeDef(param, undefined);
  if (!def) return '';
  const { warnLow, warnHigh, critLow, critHigh } = def;
  const unit = getRangeUnit(param);
  const v = value as number;
  if (critLow  !== null && v < critLow)  return `Critical: < ${critLow} ${unit}`;
  if (critHigh !== null && v > critHigh) return `Critical: > ${critHigh} ${unit}`;
  if (warnLow  !== null && v < warnLow)  return `Low: < ${warnLow} ${unit}`;
  if (warnHigh !== null && v > warnHigh) return `High: > ${warnHigh} ${unit}`;
  return '';
}

/**
 * Human-readable label for a VitalParam, used in tooltips and dialogs.
 */
export function getRangeLabel(param: VitalParam): string {
  switch (param) {
    case 'hr':    return 'Heart Rate';
    case 'rr':    return 'Resp Rate';
    case 'tempF': return 'Temperature';
    case 'sysBP': return 'Systolic BP';
    case 'diaBP': return 'Diastolic BP';
    case 'map':   return 'MAP';
    case 'spo2':  return 'SpO\u2082';
    case 'etco2': return 'ETCO\u2082';
  }
}

/**
 * Unit string for a VitalParam.
 */
export function getRangeUnit(param: VitalParam): string {
  switch (param) {
    case 'hr':    return 'bpm';
    case 'rr':    return 'brpm';
    case 'tempF': return '\u00B0F';
    case 'sysBP':
    case 'diaBP':
    case 'map':   return 'mmHg';
    case 'spo2':  return '%';
    case 'etco2': return 'mmHg';
  }
}

/**
 * Return a short normal-range string for display in tooltips.
 * e.g. "60\u201320 bpm"
 */
export function getNormalRangeStr(param: VitalParam, species: string | undefined): string {
  const { warnLow, warnHigh } = getRangeDef(param, species);
  const unit = getRangeUnit(param);
  if (warnLow !== null && warnHigh !== null) return `${warnLow}\u2013${warnHigh} ${unit}`;
  if (warnLow !== null)                      return `>${warnLow} ${unit}`;
  if (warnHigh !== null)                     return `<${warnHigh} ${unit}`;
  return '\u2014';
}
