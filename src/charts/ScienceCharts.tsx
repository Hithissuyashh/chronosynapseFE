import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PhaseWindow, ScienceRecord } from "@/types/science";
import { INVERSE_PHI } from "@/types/science";
import { formatNumber } from "@/components/Readout";

const axisStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  fill: "var(--color-muted-foreground)",
};

function PhaseBoundaries({ phases }: { phases: PhaseWindow[] }) {
  return (
    <>
      {phases.slice(1).map((p) => (
        <ReferenceLine
          key={`${p.phase}-${p.start}`}
          x={p.start}
          stroke="var(--color-border)"
          strokeDasharray="3 3"
          label={{
            value: `Phase ${p.phase}`,
            position: "insideTopLeft",
            fill: "var(--color-muted-foreground)",
            fontSize: 10,
            fontFamily: "var(--font-mono)",
          }}
        />
      ))}
    </>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  digits = 5,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: number | string;
  digits?: number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover/95 px-3 py-2.5 text-xs shadow-2xl backdrop-blur-md">
      <div className="readout mb-1 text-muted-foreground">tick = {label}</div>
      {payload.map((e) => (
        <div key={e.name} className="readout flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-2 w-2"
            style={{ background: e.color }}
          />
          <span className="text-muted-foreground">{e.name}</span>
          <span className="ml-auto text-foreground">
            {formatNumber(e.value ?? Number.NaN, digits)}
          </span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  records: ScienceRecord[];
  phases: PhaseWindow[];
  currentTick: number;
}

/** Chart 1 — Kalman diagnostics straight from the backend series. */
export function KalmanDiagnosticsChart({ records, phases, currentTick }: Props) {
  const data = records.map((r) => ({
    tick: r.tick,
    "uncertainty P": r.kalman.uncertainty,
    "gain K": r.kalman.gain,
    "innovation y": r.kalman.innovation,
  }));
  const hasGain = records.some((r) => r.kalman.gain !== null);

  return (
    <figure className="m-0">
      <figcaption className="panel-label mb-2">
        Chart 1 — Kalman diagnostics: uncertainty P (log, left), gain K &amp;
        innovation y (right)
      </figcaption>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 8, bottom: 4, left: -8 }}>
            <defs>
              <linearGradient id="grad-p" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-estimate)" stopOpacity={0.30} />
                <stop offset="100%" stopColor="var(--color-estimate)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-grid)" strokeDasharray="2 4" />
            <XAxis dataKey="tick" tick={axisStyle} stroke="var(--color-border)" />
            <YAxis
              yAxisId="p"
              scale="log"
              domain={["auto", "auto"]}
              tick={axisStyle}
              stroke="var(--color-border)"
              tickFormatter={(v: number) => v.toExponential(0)}
              width={58}
            />
            <YAxis
              yAxisId="k"
              orientation="right"
              tick={axisStyle}
              stroke="var(--color-border)"
              tickFormatter={(v: number) => v.toFixed(3)}
              width={58}
            />
            <Tooltip content={<ChartTooltip />} />
            <PhaseBoundaries phases={phases} />
            <ReferenceLine
              yAxisId="k"
              x={currentTick}
              stroke="var(--color-primary)"
              strokeWidth={1}
            />
            {hasGain ? (
              <ReferenceLine
                yAxisId="k"
                y={INVERSE_PHI}
                stroke="var(--color-truth)"
                strokeDasharray="4 3"
                label={{
                  value: "1/φ ≈ 0.618",
                  position: "right",
                  fill: "var(--color-truth)",
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                }}
              />
            ) : null}
            <Line
              yAxisId="k"
              type="monotone"
              dataKey="innovation y"
              stroke="var(--color-negative-channel)"
              strokeWidth={1}
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
            <Line
              yAxisId="k"
              type="stepAfter"
              dataKey="gain K"
              stroke="var(--color-measure)"
              strokeWidth={1.75}
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
            <Area
              yAxisId="p"
              type="monotone"
              dataKey="uncertainty P"
              stroke="none"
              fill="url(#grad-p)"
              isAnimationActive={false}
              activeDot={false}
              legendType="none"
            />
            <Line
              yAxisId="p"
              type="monotone"
              dataKey="uncertainty P"
              stroke="var(--color-estimate)"
              strokeWidth={1.75}
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-0.5 w-4 bg-estimate" /> posterior variance P
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-0.5 w-4 bg-measure" /> gain K
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-0.5 w-4 bg-negative-channel" /> innovation y
        </li>
        <li className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="h-0.5 w-4 border-t border-dashed border-truth"
          />{" "}
          reference line 1/φ (not backend data)
        </li>
      </ul>
    </figure>
  );
}

/** Chart 2 — synaptic association strengths over time. */
export function SigmaChart({ records, phases, currentTick }: Props) {
  const data = records.map((r) => ({
    tick: r.tick,
    "σ(THERMAL,NEGATIVE)": r.sigma.thermal_negative,
    "σ(THERMAL,POSITIVE)": r.sigma.thermal_positive,
    "σ(THERMAL,MAGNETIC)": r.sigma.thermal_magnetic,
  }));

  return (
    <figure className="m-0">
      <figcaption className="panel-label mb-2">
        Chart 2 — BDH-inspired association strengths σ over time
      </figcaption>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 8, bottom: 4, left: -12 }}>
            <defs>
              <linearGradient id="grad-neg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-negative-channel)" stopOpacity={0.30} />
                <stop offset="100%" stopColor="var(--color-negative-channel)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <defs>
              <linearGradient id="grad-pos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-positive-channel)" stopOpacity={0.30} />
                <stop offset="100%" stopColor="var(--color-positive-channel)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-grid)" strokeDasharray="2 4" />
            <XAxis dataKey="tick" tick={axisStyle} stroke="var(--color-border)" />
            <YAxis
              tick={axisStyle}
              stroke="var(--color-border)"
              tickFormatter={(v: number) => v.toFixed(2)}
              width={54}
            />
            <Tooltip content={<ChartTooltip digits={4} />} />
            <PhaseBoundaries phases={phases} />
            <ReferenceLine x={currentTick} stroke="var(--color-primary)" strokeWidth={1} />
            <Area
              type="linear"
              dataKey="σ(THERMAL,NEGATIVE)"
              stroke="none"
              fill="url(#grad-neg)"
              isAnimationActive={false}
              activeDot={false}
              legendType="none"
            />
            <Area
              type="linear"
              dataKey="σ(THERMAL,POSITIVE)"
              stroke="none"
              fill="url(#grad-pos)"
              isAnimationActive={false}
              activeDot={false}
              legendType="none"
            />
            <Line
              type="linear"
              dataKey="σ(THERMAL,NEGATIVE)"
              stroke="var(--color-negative-channel)"
              strokeWidth={1.75}
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
            <Line
              type="linear"
              dataKey="σ(THERMAL,POSITIVE)"
              stroke="var(--color-positive-channel)"
              strokeWidth={1.75}
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
            <Line
              type="linear"
              dataKey="σ(THERMAL,MAGNETIC)"
              stroke="var(--color-magnetic-channel)"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Lines are plotted as reported per tick (no interpolation or smoothing);
        gaps mean the backend did not publish that field.
      </p>
    </figure>
  );
}

/** Optional physical-telemetry chart, shown only if the backend sends it. */
export function DetuningChart({ records, phases, currentTick }: Props) {
  const data = records.map((r) => ({
    tick: r.tick,
    "true detuning": r.clock.true_detuning_hz,
    "measured offset": r.clock.measured_offset_hz,
    "Kalman estimate": r.kalman.estimate,
  }));

  return (
    <figure className="m-0">
      <figcaption className="panel-label mb-2">
        Detuning — truth vs. measurement vs. Kalman estimate (Hz)
      </figcaption>
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 8, bottom: 4, left: -12 }}>
            <defs>
              <linearGradient id="grad-est" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-estimate)" stopOpacity={0.30} />
                <stop offset="100%" stopColor="var(--color-estimate)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-grid)" strokeDasharray="2 4" />
            <XAxis dataKey="tick" tick={axisStyle} stroke="var(--color-border)" />
            <YAxis
              tick={axisStyle}
              stroke="var(--color-border)"
              tickFormatter={(v: number) => v.toPrecision(3)}
              width={62}
            />
            <Tooltip content={<ChartTooltip />} />
            <PhaseBoundaries phases={phases} />
            <ReferenceLine x={currentTick} stroke="var(--color-primary)" strokeWidth={1} />
            <Line
              type="monotone"
              dataKey="measured offset"
              stroke="var(--color-measure)"
              strokeWidth={1}
              strokeDasharray="2 2"
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="true detuning"
              stroke="var(--color-truth)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="Kalman estimate"
              stroke="none"
              fill="url(#grad-est)"
              isAnimationActive={false}
              activeDot={false}
              legendType="none"
            />
            <Line
              type="monotone"
              dataKey="Kalman estimate"
              stroke="var(--color-estimate)"
              strokeWidth={1.75}
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
