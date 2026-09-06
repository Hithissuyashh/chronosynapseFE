import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { useScience } from "@/lib/useScience";
import { formatNumber } from "@/components/Readout";
import { GlassPanel, MetricTile } from "@/components/system/Panels";
import { AbstractionBadge } from "@/components/ExperimentControl";

const TITLE = "Chronosynapse — Streaming State Estimation";
const DESCRIPTION =
  "Streaming quantum-clock state estimation with explicit Kalman uncertainty, alongside a BDH-inspired synaptic association-strength state, served live over a Pathway + FastAPI pipeline.";

export const Route = createFileRoute("/")({
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
  component: Overview,
});

function Overview() {
  const { records, latestRecord, liveTick, offline } = useScience();
  const record = latestRecord ?? records[records.length - 1] ?? null;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-16 px-4 pb-24 pt-14 lg:px-8 lg:pt-20">
      {/* ------------------------------------------------------------ hero */}
      <section className="flex flex-col items-center text-center">
        <span className="readout rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.6875rem] uppercase tracking-[0.18em] text-muted-foreground">
          DataForge 2026 · Pathway track
        </span>

        <h1 className="display-type mt-7 max-w-4xl text-[2.9rem] leading-[0.95] tracking-tight text-foreground sm:text-6xl lg:text-[4.75rem]">
          Two ways to hold state
          <span className="block bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-transparent">
            from one physical timeline
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
          A quantum clock streams telemetry. One branch estimates its state with an
          explicit uncertainty. The other holds association strength that reshapes
          itself as the world changes.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link to="/console" className="pill-btn-primary">
            Open live console <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/pipeline" className="pill-btn text-muted-foreground">
            Trace the pipeline <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* --------------------------------------------------- live state card */}
      <section className="hero-shell mx-auto w-full max-w-5xl p-5 sm:p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="panel-label text-foreground">Backend state</p>
          <span className="readout text-[0.6875rem] text-muted-foreground">
            {liveTick === null ? "awaiting stream" : `tick t = ${liveTick}`}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <MetricTile
            label="Phase"
            value={record?.phase ?? "—"}
            hint="Current phase of the controlled A → B → A protocol, as reported by the backend."
          />
          <MetricTile
            label="Uncertainty"
            symbol="P"
            value={
              record?.kalman.uncertainty == null
                ? "—"
                : formatNumber(record.kalman.uncertainty, 6)
            }
            hint="Kalman posterior variance. An uncertainty state — never placed on the same axis as σ."
          />
          <MetricTile
            label="Gain"
            symbol="K"
            value={
              record?.kalman.gain == null ? "—" : formatNumber(record.kalman.gain, 6)
            }
            hint="Steady-state Kalman gain from the backend."
          />
          <MetricTile
            label="Estimate"
            symbol="x̂"
            value={
              record?.kalman.estimate == null
                ? "—"
                : formatNumber(record.kalman.estimate, 6)
            }
            hint="Kalman state estimate published by the backend."
          />
          <MetricTile
            label="Association"
            symbol="σ(T,NEG)"
            value={
              record?.sigma.thermal_negative == null
                ? "—"
                : formatNumber(record.sigma.thermal_negative, 6)
            }
            accentClassName="text-negative-channel"
            hint="BDH-inspired association strength for the THERMAL–NEGATIVE pair."
          />
          <MetricTile
            label="Association"
            symbol="σ(T,POS)"
            value={
              record?.sigma.thermal_positive == null
                ? "—"
                : formatNumber(record.sigma.thermal_positive, 6)
            }
            accentClassName="text-positive-channel"
            hint="BDH-inspired association strength for the competing THERMAL–POSITIVE pair."
          />
        </div>

        <p className="readout mt-5 text-[0.6875rem] text-muted-foreground">
          source: {API_BASE}
          {offline ? " · unreachable — nothing is substituted" : ""}
        </p>
      </section>

      {/* ----------------------------------------------------------- tiles */}
      <section className="flex flex-col gap-6">
        <div className="max-w-2xl">
          <p className="panel-label">System map</p>
          <h2 className="display-type mt-3 text-3xl tracking-tight text-foreground sm:text-4xl">
            Four surfaces, one timeline
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Every surface reads the same backend stream. Nothing on this site is
            generated in the browser.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <NavTile
            to="/console"
            eyebrow="Telemetry"
            title="System readout"
            body="Observation, model state and memory state resolved at a single backend tick."
            footer={
              liveTick === null
                ? "awaiting stream"
                : `t = ${liveTick} · ${records.length} ticks`
            }
          />
          <NavTile
            to="/console"
            eyebrow="Estimation"
            title="Kalman branch"
            body="Explicit state estimation: estimate x̂, uncertainty P, innovation y, gain K."
            footer={
              record?.kalman.gain == null
                ? "K = —"
                : `K = ${formatNumber(record.kalman.gain, 6)}`
            }
          />
          <NavTile
            to="/console"
            eyebrow="Memory"
            title="Synaptic dynamics"
            body="Association strength σ over a sparse concept graph: THERMAL, NEGATIVE, POSITIVE, MAGNETIC."
            footer={
              record?.sigma.memory_difference == null
                ? "Δσ = —"
                : `Δσ = ${formatNumber(record.sigma.memory_difference, 6)}`
            }
          />
          <NavTile
            to="/pipeline"
            eyebrow="Stream"
            title="Streaming pipeline"
            body="Telemetry, event encoding, dual branches, comparison, Pathway stream, FastAPI service."
            footer="trace all stages →"
          />
        </div>
      </section>

      {/* ------------------------------------------------------- distinction */}
      <section className="grid gap-4 lg:grid-cols-2">
        <GlassPanel className="p-6">
          <p className="panel-label">Model state</p>
          <h3 className="display-type mt-3 text-2xl text-foreground">
            Uncertainty is stated, not implied
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The Kalman branch maintains an estimate and an explicit variance P. Under
            fixed process and measurement-noise assumptions the scalar filter
            converges to a steady-state gain; in the Q = R configuration used here
            that gain is 1/φ.
          </p>
        </GlassPanel>
        <GlassPanel className="p-6">
          <p className="panel-label">Memory state</p>
          <h3 className="display-type mt-3 text-2xl text-foreground">
            Recent activity reshapes connections
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The BDH-inspired abstraction holds state as association strength σ across
            concept pairs. Kalman filtering and synaptic fast-weight memory are two
            different mechanisms for maintaining state from streaming information —
            not two implementations of one mechanism.
          </p>
          <div className="mt-5">
            <AbstractionBadge />
          </div>
        </GlassPanel>
      </section>

      <p className="readout text-center text-[0.6875rem] text-muted-foreground">
        BDH-inspired educational abstraction — not the official BDH implementation.
      </p>
    </div>
  );
}

function NavTile({
  to,
  eyebrow,
  title,
  body,
  footer,
}: {
  to: "/console" | "/pipeline";
  eyebrow: string;
  title: string;
  body: string;
  footer: string;
}) {
  return (
    <Link
      to={to}
      className="glass-panel group flex min-w-0 flex-col gap-3 p-5 transition-all hover:-translate-y-0.5 hover:border-warm/40 focus-visible:ring-1 focus-visible:ring-ring"
    >
      <span className="panel-label">{eyebrow}</span>
      <h3 className="text-base font-medium tracking-tight text-foreground">{title}</h3>
      <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
      <span className="readout hairline mt-auto pt-3 text-[0.6875rem] text-muted-foreground group-hover:text-warm">
        {footer}
      </span>
    </Link>
  );
}
