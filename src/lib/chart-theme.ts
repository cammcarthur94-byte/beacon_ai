/**
 * Global Chart Design System Tokens & Configuration Preset
 * Single source of truth for all Recharts & graph visualizations across the application.
 */

export const CHART_THEME_COLORS = {
  primary: 'var(--chart-primary)',
  primaryForeground: 'var(--chart-primary-foreground)',
  emerald: 'var(--chart-emerald)',
  rose: 'var(--chart-rose)',
  slate: 'var(--chart-slate)',
  grid: 'var(--chart-grid)',
  axis: 'var(--chart-axis)',
} as const;

/**
 * Standard CartesianGrid properties:
 * - Softened horizontal grid lines using high-transparency border token
 * - Vertical grid lines completely eliminated
 */
export const chartGridProps = {
  strokeDasharray: '3 3',
  stroke: 'var(--chart-grid)',
  vertical: false,
} as const;

/**
 * Standard X-Axis typography and styling:
 * - text-xs (11px) font size with monospace numerals
 * - Cleaned-up borders: no tick lines, no harsh axis borders
 */
export const chartXAxisProps = {
  stroke: 'var(--chart-axis)',
  fontSize: 11,
  fontFamily: "'Google Sans', 'Open Sans', sans-serif",
  tickLine: false,
  axisLine: false,
} as const;

/**
 * Standard Y-Axis typography and styling:
 * - Consistent text-xs (11px) Google Sans styling
 * - Seamless alignment without harsh vertical axis lines
 */
export const chartYAxisProps = {
  stroke: 'var(--chart-axis)',
  fontSize: 11,
  fontFamily: "'Google Sans', 'Open Sans', sans-serif",
  tickLine: false,
  axisLine: false,
} as const;

/**
 * Standard Tailwind class string for chart hover tooltips
 */
export const chartTooltipContainerClass =
  'rounded-lg border border-zinc-200 bg-white/95 backdrop-blur-xs p-3 shadow-lg text-xs font-sans text-zinc-900 transition-all';
