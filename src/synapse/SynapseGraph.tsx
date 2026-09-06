import { useMemo, useState } from "react";
import {
  CONCEPTS,
  PHASE_SEMANTICS,
  type ConceptId,
  type ScienceRecord,
} from "@/types/science";
import { formatNumber } from "@/components/Readout";

/**
 * Sparse synaptic graph rendered as SVG (deterministic layout, no physics
 * animation). Edge stroke width AND opacity AND the printed numeric label are
 * all driven by the backend σ values, so meaning never depends on color alone.
 * Only edges the backend publishes are drawn.
 */

const LAYOUT: Record<ConceptId, { x: number; y: number }> = {
  THERMAL: { x: 50, y: 50 },
  NEGATIVE: { x: 14, y: 20 },
  POSITIVE: { x: 86, y: 20 },
  MAGNETIC: { x: 50, y: 90 },
};

const CHANNEL_VAR: Record<ConceptId, string> = {
  THERMAL: "var(--color-thermal-channel)",
  NEGATIVE: "var(--color-negative-channel)",
  POSITIVE: "var(--color-positive-channel)",
  MAGNETIC: "var(--color-magnetic-channel)",
};

export function SynapseGraph({ record }: { record: ScienceRecord }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const active = useMemo<ConceptId[]>(() => {
    const labels = record.semantic_events.length
      ? record.semantic_events
      : record.phase
        ? PHASE_SEMANTICS[record.phase]
        : [];
    return CONCEPTS.filter((c) =>
      labels.some((l) => l.toUpperCase().includes(c)),
    );
  }, [record.semantic_events, record.phase]);

  const edges = useMemo(
    () =>
      (
        [
          { partner: "NEGATIVE" as ConceptId, value: record.sigma.thermal_negative },
          { partner: "POSITIVE" as ConceptId, value: record.sigma.thermal_positive },
          { partner: "MAGNETIC" as ConceptId, value: record.sigma.thermal_magnetic },
        ] as const
      ).filter((e) => e.value !== null),
    [record.sigma],
  );

  const max = Math.max(0.05, ...edges.map((e) => e.value ?? 0));

  return (
    <div className="relative">
      <svg
        viewBox="0 0 100 105"
        role="img"
        aria-label={`Synaptic graph at tick ${record.tick}. ${edges
          .map((e) => `sigma THERMAL ${e.partner} = ${(e.value ?? 0).toFixed(4)}`)
          .join("; ")}`}
        className="h-[300px] w-full"
      >
        {edges.map((e) => {
          const p1 = LAYOUT.THERMAL;
          const p2 = LAYOUT[e.partner];
          const value = e.value ?? 0;
          const norm = value / max;
          const isActive = active.includes("THERMAL") && active.includes(e.partner);
          const hot = hovered === e.partner;
          return (
            <g key={e.partner}>
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={value > 0 ? CHANNEL_VAR[e.partner] : "var(--color-border)"}
                strokeWidth={0.25 + norm * 2.4}
                strokeOpacity={0.22 + norm * 0.78}
                strokeDasharray={isActive ? undefined : "1.5 1.5"}
                className="transition-all duration-300"
              />
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="transparent"
                strokeWidth={5}
                onMouseEnter={() => setHovered(e.partner)}
                onMouseLeave={() => setHovered(null)}
              />
              <text
                x={(p1.x + p2.x) / 2}
                y={(p1.y + p2.y) / 2 - 1}
                textAnchor="middle"
                fontSize={hot ? 3.6 : 3}
                fontFamily="var(--font-mono)"
                fill={hot ? "var(--color-foreground)" : "var(--color-muted-foreground)"}
              >
                {value.toFixed(4)}
              </text>
            </g>
          );
        })}

        {CONCEPTS.map((c) => {
          const p = LAYOUT[c];
          const on = active.includes(c);
          return (
            <g key={c}>
              <circle
                cx={p.x}
                cy={p.y}
                r={on ? 5.4 : 4.4}
                fill="var(--color-card)"
                stroke={CHANNEL_VAR[c]}
                strokeWidth={on ? 1.2 : 0.5}
                className="transition-all duration-300"
              />
              {on ? (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={7.6}
                  fill="none"
                  stroke={CHANNEL_VAR[c]}
                  strokeOpacity={0.35}
                  strokeWidth={0.4}
                />
              ) : null}
              <text
                x={p.x}
                y={p.y + 11}
                textAnchor="middle"
                fontSize={3.4}
                fontFamily="var(--font-mono)"
                letterSpacing={0.2}
                fill={on ? "var(--color-foreground)" : "var(--color-muted-foreground)"}
              >
                {c}
              </text>
              {on ? (
                <text
                  x={p.x}
                  y={p.y + 1.2}
                  textAnchor="middle"
                  fontSize={3}
                  fontFamily="var(--font-mono)"
                  fill={CHANNEL_VAR[c]}
                >
                  ON
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-xs text-muted-foreground">
        Solid edges = both concepts under stimulus at this tick; dashed edges are
        not currently stimulated. Widths and printed values are backend σ, not
        decoration.
      </p>
      <dl className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
        {[
          { label: "σ(THERMAL, NEGATIVE)", value: record.sigma.thermal_negative },
          { label: "σ(THERMAL, POSITIVE)", value: record.sigma.thermal_positive },
          { label: "σ(THERMAL, MAGNETIC)", value: record.sigma.thermal_magnetic },
        ].map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-2 rounded-sm border border-border/70 bg-card px-2.5 py-1.5"
          >
            <dt className="readout text-[0.6875rem] text-muted-foreground">
              {row.label}
            </dt>
            <dd className="readout text-sm">
              {row.value === null ? "—" : formatNumber(row.value, 4)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
