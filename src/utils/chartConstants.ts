// ─── Shared Layout Constants for Unified Chart Alignment ──────────────────────
// Both VitalSignsChart (Recharts) and AnesthesiaMedicationChart (DOM/CSS)
// use these identical values so their plot areas line up pixel-for-pixel.

/** ScatterChart margin.left */
export const CHART_LEFT_MARGIN = 56;

/** ScatterChart margin.right */
export const CHART_RIGHT_MARGIN = 16;

/** Recharts YAxis width prop */
export const YAXIS_WIDTH = 50;

/** Total px from container left edge to plot-area left edge (margin + YAxis) */
export const PLOT_AREA_LEFT = CHART_LEFT_MARGIN + YAXIS_WIDTH; // 106

/** Total px from container right edge to plot-area right edge */
export const PLOT_AREA_RIGHT = CHART_RIGHT_MARGIN; // 16

/**
 * Generate explicit 5-minute tick values for the shared X-axis.
 * Returns millisecond timestamps at every 5-minute boundary within [startMs, endMs].
 */
export function generate5MinTicks(startMs: number, endMs: number): number[] {
  const FIVE_MIN_MS = 5 * 60 * 1000;
  const ticks: number[] = [];

  // First tick: next 5-minute boundary at or after startMs
  const firstTick = Math.ceil(startMs / FIVE_MIN_MS) * FIVE_MIN_MS;

  for (let t = firstTick; t <= endMs; t += FIVE_MIN_MS) {
    ticks.push(t);
  }

  return ticks;
}
