import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useScience } from "@/lib/useScience";
import { GlassPanel, SectionHeader } from "@/components/system/Panels";
import { PipelineDeck } from "@/components/pipeline/PipelineDeck";
import {
  PipelineConnector,
  PipelineNode,
  StageDetail,
  type Stage,
} from "@/components/pipeline/PipelineStage";
import { AbstractionBadge } from "@/components/ExperimentControl";

const TITLE = "Pipeline — Chronosynapse";
const DESCRIPTION =
  "Interactive trace of the full data pipeline: physical environment, quantum clock, telemetry, event encoding, Kalman estimation, BDH-inspired synaptic memory, comparison, Pathway stream, FastAPI, live console.";

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PipelinePage,
});

const STAGES: Stage[] = [
  {
    id: "environment",
    kind: "INPUT",
    title: "PHYSICAL ENVIRONMENT",
    summary:
      "The conditions acting on the clock body. Temperature and magnetic field are advanced each tick; they are the only source of variation the rest of the pipeline responds to.",
    input: "ambient conditions per tick",
    output: "temperature T, magnetic field B",
    provenance: "COMPUTED DATA",
    console: "Not shown directly — its effect appears as movement in the true detuning trace.",
    next: ["clock"],
  },
  {
    id: "clock",
    kind: "PROCESS",
    title: "QUANTUM CLOCK",
    summary:
      "Converts environmental conditions into a frequency detuning Δ, then reports a measurement of it corrupted by readout noise. Δ is never handed to the estimator — only the noisy measurement z is.",
    input: "temperature T, magnetic field B",
    output: "true detuning Δ, measured offset z",
    provenance: "COMPUTED DATA",
    console: "Both series appear in the detuning chart: true value versus measurement.",
    next: ["telemetry"],
  },
  {
    id: "telemetry",
    kind: "INPUT",
    title: "TELEMETRY",
    summary:
      "Packages each observation into a tick-indexed record and flags physical events such as a thermal excursion. Physical telemetry events stay distinct from the controlled semantic stimuli applied later.",
    input: "true detuning Δ, measured offset z",
    output: "tick-indexed telemetry records, physical event flags",
    provenance: "LIVE DATA",
    console: "Sets the tick counter and fills the Physical events card.",
    next: ["encoding"],
  },
  {
    id: "encoding",
    kind: "PROCESS",
    title: "EVENT ENCODING",
    summary:
      "Assigns the concepts active in each tick — THERMAL, NEGATIVE, POSITIVE, MAGNETIC — according to the A → B → A protocol, and stamps the tick with its phase.",
    input: "telemetry records, phase schedule",
    output: "phase label, semantic event set per tick",
    provenance: "COMPUTED DATA",
    console: "Drives the current phase badge, the A/B/A timeline and the Semantic events card.",
    next: ["stream"],
  },
  {
    id: "stream",
    kind: "STREAM",
    title: "STREAMING DATA",
    summary:
      "A single tick-ordered stream fans out to both branches, so state estimation and memory always observe the same timeline in the same order.",
    input: "telemetry records + semantic events",
    output: "one ordered event stream, keyed by tick",
    provenance: "LIVE DATA",
    console: "Guarantees every console panel is aligned on the same tick.",
    next: ["kalman", "memory"],
  },
  {
    id: "kalman",
    kind: "ESTIMATION",
    title: "KALMAN FILTER",
    summary:
      "Predicts the next state and grows its uncertainty, then corrects using the innovation y = z − x̂ scaled by the gain K = P⁻/(P⁻+R). Uncertainty P is carried forward explicitly rather than inferred.",
    input: "measured offset z per tick",
    output: "estimate x̂, uncertainty P, innovation y, covariance S, gain K",
    provenance: "COMPUTED DATA",
    console: "Feeds the Kalman tiles and the uncertainty / diagnostics chart, including gain convergence.",
    next: ["state-estimate"],
  },
  {
    id: "memory",
    kind: "MEMORY",
    title: "SYNAPTIC MEMORY / FAST WEIGHTS",
    summary:
      "Holds an association strength per concept pair. Co-activation writes into the pair with learning rate η; every unstimulated pair is weakened by decay u, so the strongest pair follows whichever regime is being presented.",
    input: "semantic events, learning rate η, decay u",
    output: "σ(T,NEG), σ(T,POS), σ(T,MAG)",
    provenance: "EDUCATIONAL ABSTRACTION",
    console: "Sets the σ tiles, the σ-over-time chart and the weight of each synapse-graph edge.",
    next: ["association-state"],
  },
  {
    id: "state-estimate",
    kind: "ESTIMATION",
    title: "STATE ESTIMATE",
    summary:
      "The estimator's state at each tick, carrying its own variance. P is an uncertainty state, measured in the units of the estimate squared, and is never placed on the σ axis.",
    input: "filter output per tick",
    output: "x̂ with variance P, estimation error",
    provenance: "COMPUTED DATA",
    console: "Shown as the estimate trace and the estimation-error readout.",
    next: ["comparison"],
  },
  {
    id: "association-state",
    kind: "MEMORY",
    title: "ASSOCIATION STATE",
    summary:
      "The memory's state at each tick. σ is an association-strength state — unitless and dimensionally unrelated to P — plus the difference between the competing pairs.",
    input: "fast-weight update per tick",
    output: "σ per concept pair, memory difference σ⁺ − σ⁻",
    provenance: "EDUCATIONAL ABSTRACTION",
    console: "Shown as the σ chart and the memory-difference readout.",
    next: ["comparison"],
  },
  {
    id: "comparison",
    kind: "PROCESS",
    title: "COMPARISON",
    summary:
      "Joins both branch states on the shared tick key so they can be read side by side. The join aligns them in time only — it asserts no mathematical equivalence between them.",
    input: "state estimate + association state",
    output: "comparison rows: phase, P, y, σ⁻, σ⁺, memory difference, error",
    provenance: "COMPUTED DATA",
    console: "Backs the full record table and every tick-aligned panel.",
    next: ["pathway"],
  },
  {
    id: "pathway",
    kind: "STREAM",
    title: "PATHWAY",
    summary:
      "The streaming substrate. It keeps the tick ordering, applies the join incrementally as ticks arrive, and materialises the kalman, bdh and comparison tables.",
    input: "comparison rows",
    output: "pathway_stream/{kalman, bdh, comparison}",
    provenance: "LIVE DATA",
    console: "Everything the console shows originates from these materialised streams.",
    next: ["fastapi"],
  },
  {
    id: "fastapi",
    kind: "SERVICE",
    title: "FASTAPI",
    summary:
      "Serves the materialised streams over HTTP and accepts the run request that starts a new experiment with the parameters chosen in the console.",
    input: "pathway streams, experiment run request",
    output: "/api/health, /api/experiment, /api/experiment/latest, /api/summary, /api/kalman, /api/memory, /api/comparison",
    provenance: "LIVE DATA",
    console: "The Run experiment button posts here; every panel then re-reads these endpoints.",
    next: ["console"],
  },
  {
    id: "console",
    kind: "VISUALIZATION",
    title: "REACT CONSOLE",
    summary:
      "This interface. It parses, formats and renders backend values only — it never computes, smooths or interpolates a scientific quantity.",
    input: "JSON over /api/*",
    output: "telemetry tiles, charts, synapse graph, phase timeline, completed-run summary",
    provenance: "LIVE DATA",
    console: "The endpoint of the pipeline: display only, no computation.",
    next: [],
  },
];

const BY_ID = new Map(STAGES.map((s) => [s.id, s]));

function downstreamOf(id: string): Set<string> {
  const out = new Set<string>();
  const walk = (cur: string) => {
    for (const n of BY_ID.get(cur)?.next ?? []) {
      if (out.has(n)) continue;
      out.add(n);
      walk(n);
    }
  };
  walk(id);
  return out;
}

function upstreamOf(id: string): Set<string> {
  const out = new Set<string>();
  const parents = (target: string) =>
    STAGES.filter((s) => s.next.includes(target)).map((s) => s.id);
  const walk = (cur: string) => {
    for (const p of parents(cur)) {
      if (out.has(p)) continue;
      out.add(p);
      walk(p);
    }
  };
  walk(id);
  return out;
}

/** Rows of the diagram; the dual-branch section is a two-column row. */
const ROWS: string[][] = [
  ["environment"],
  ["clock"],
  ["telemetry"],
  ["encoding"],
  ["stream"],
  ["kalman", "memory"],
  ["state-estimate", "association-state"],
  ["comparison"],
  ["pathway"],
  ["fastapi"],
  ["console"],
];

function PipelinePage() {
  const { health, liveTick, records } = useScience();
  const online = health.data?.online === true;
  const [selected, setSelected] = useState<string>("stream");
  const [hovered, setHovered] = useState<string | null>(null);

  const focus = hovered ?? selected;
  const related = useMemo(() => {
    const down = downstreamOf(focus);
    const up = upstreamOf(focus);
    return { down, up };
  }, [focus]);

  const stateOf = (id: string): "selected" | "linked" | "dim" | "base" => {
    if (id === focus) return "selected";
    if (related.down.has(id) || related.up.has(id)) return "linked";
    return "dim";
  };

  const detail = BY_ID.get(selected)!;

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-8 lg:px-8 lg:py-10">
      <SectionHeader
        eyebrow="Stream processing"
        title="Trace the pipeline"
        description="Select or hover a stage to illuminate its upstream and downstream path, and to inspect what data enters and leaves it."
        aside={
          <span className="readout text-[0.6875rem] text-muted-foreground">
            {liveTick === null
              ? "no tick reported"
              : `tick t = ${liveTick} · ${records.length} ticks`}
          </span>
        }
      />

      <PipelineDeck />

      <div className="flex flex-wrap items-center gap-2">
        <AbstractionBadge />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
        {/* --------------------------------------------------- diagram */}
        <GlassPanel className="p-4 sm:p-6">
          <p className="panel-label">Architecture</p>
          <div className="mt-4 flex flex-col items-stretch">
            {ROWS.map((row, rowIndex) => {
              const branch = row.length > 1;
              return (
                <div key={row.join("-")} className="min-w-0">
                  <div
                    className={
                      branch
                        ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
                        : "grid grid-cols-1"
                    }
                  >
                    {row.map((id, i) => {
                      const stage = BY_ID.get(id)!;
                      return (
                        <PipelineNode
                          key={id}
                          stage={stage}
                          state={stateOf(id)}
                          active={online}
                          index={rowIndex * 2 + i}
                          onSelect={() => setSelected(id)}
                          onHover={(h) => setHovered(h ? id : null)}
                        />
                      );
                    })}
                  </div>
                  {rowIndex < ROWS.length - 1 ? (
                    <div
                      className={
                        branch
                          ? "grid grid-cols-1 sm:grid-cols-2"
                          : "grid grid-cols-1"
                      }
                    >
                      {(branch ? row : ["_"]).map((id) => (
                        <PipelineConnector
                          key={`c-${rowIndex}-${id}`}
                          lit={
                            id === "_"
                              ? true
                              : stateOf(id) !== "dim"
                          }
                          active={online}
                          label="data flow"
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <p className="readout hairline mt-5 pt-3 text-[0.6875rem] text-muted-foreground">
            Packet motion represents the flow of data through the system, not
            numerical results.
          </p>
        </GlassPanel>

        {/* ---------------------------------------------------- inspector */}
        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20">
          <GlassPanel className="p-5">
            <StageDetail stage={detail} />
          </GlassPanel>

          <GlassPanel className="p-5">
            <p className="panel-label">Branch distinction</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Kalman filtering and synaptic fast-weight memory are two different
              mechanisms for maintaining state from streaming information. P is an
              uncertainty state; σ is an association-strength state. They are never
              plotted on the same numerical axis and are not mathematically
              equivalent.
            </p>
            <p className="readout mt-4 text-[0.6875rem] text-muted-foreground">
              BDH-inspired educational abstraction — not the official BDH
              implementation.
            </p>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
