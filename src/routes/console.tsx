import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/lib/api";
import { useScience } from "@/lib/useScience";
import { PHASE_SEMANTICS } from "@/types/science";
import { formatNumber } from "@/components/Readout";
import {
  ConsolePanel,
  GlassPanel,
  MetricTile,
} from "@/components/system/Panels";
import {
  DetuningChart,
  KalmanDiagnosticsChart,
  SigmaChart,
} from "@/charts/ScienceCharts";
import { SynapseGraph } from "@/synapse/SynapseGraph";
import { Timeline } from "@/timeline/Timeline";
import { WhatAmISeeing } from "@/education/WhatAmISeeing";
import { GoldenRatioCallout } from "@/education/GoldenRatioCallout";
import { ExperimentControl } from "@/components/ExperimentControl";

const TITLE = "Live Console — Chronosynapse";
const DESCRIPTION =
  "Research instrument console: run the A → B → A experiment, and observe Kalman state estimation with explicit uncertainty P beside BDH-inspired synaptic association strengths σ.";

export const Route = createFileRoute("/console")({
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
  component: ConsolePage,
});

function ConsolePage() {
  const {
    health,
    series,
    latestRecord,
    summary,
    records,
    phases,
    experimentParams,
    liveTick,
    offline,
    refreshing,
    replayActive,
    applyReplay,
  } = useScience();

  const [tick, setTick] = useState<number | null>(null);
  const [followLive, setFollowLive] = useState(true);

  useEffect(() => {
    if (followLive && liveTick !== null) setTick(liveTick);
  }, [followLive, liveTick]);

  const activeTick = tick ?? liveTick;
  const record = useMemo(() => {
    if (activeTick === null) return latestRecord;
    return (
      records.find((r) => r.tick === activeTick) ??
      (latestRecord?.tick === activeTick ? latestRecord : null) ??
      records[records.length - 1] ??
      latestRecord ??
      null
    );
  }, [records, activeTick, latestRecord]);

  const semantic = record?.semantic_events.length
    ? record.semantic_events.join(" + ")
    : record?.phase
      ? `${PHASE_SEMANTICS[record.phase].join(" + ")} (protocol)`
      : "—";

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-4 py-10 lg:px-8">
      <GlassPanel className="px-6 py-7 sm:px-8 sm:py-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="panel-label">Experiment console</p>
            <h1 className="display-type mt-3 text-4xl leading-[1.05] text-foreground sm:text-5xl">
              Control <span className="text-muted-foreground">·</span> Observe{" "}
              <span className="text-muted-foreground">·</span> Compare
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Every value on this page is read from the FastAPI service. Nothing is
              simulated in the browser. Physical and Kalman values come from recorded
              QuantumClock telemetry. Synaptic memory is recomputed from the
              controlled semantic stimulus using a BDH-inspired educational
              abstraction.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <span className="readout inset-well px-3 py-1.5 text-[0.6875rem] text-muted-foreground">
              {API_BASE} · {records.length} ticks
              {replayActive ? " · interactive replay" : ""}
              {refreshing ? " · refreshing…" : ""}
            </span>
            
          </div>
        </div>
      </GlassPanel>

      {offline ? (
        <p
          role="alert"
          className="panel-surface readout border-destructive/60 px-4 py-3 text-sm text-destructive"
        >
          Cannot reach the science backend at {API_BASE} ({health.data?.detail}).
          Nothing is displayed until the service answers — no values are simulated in
          the browser.
        </p>
      ) : null}

      <ExperimentControl params={experimentParams} onReplayComplete={applyReplay} />

      {!record ? (
        <p className="panel-surface readout px-4 py-6 text-sm text-muted-foreground">
          {health.isLoading
            ? "Contacting backend…"
            : offline
              ? "Waiting for the backend."
              : "Loading experiment stream from /api/experiment…"}
        </p>
      ) : (
        <>
          <ConsolePanel
            title="System telemetry"
            subtitle="Observation, model state and memory state at a single backend tick."
            aside={
              <span className="readout text-xs text-muted-foreground">
                t = {record.tick} · phase {record.phase ?? "—"}
              </span>
            }
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
              <MetricTile
                label="Current tick"
                symbol="t"
                value={String(record.tick)}
                hint="Experiment tick reported by the backend; the entire page renders this single tick."
              />
              <MetricTile
                label="Phase"
                value={record.phase ?? "—"}
                hint="Experiment phase as published by the backend. A = THERMAL + NEGATIVE, B = THERMAL + POSITIVE, C = THERMAL + NEGATIVE."
              />
              <MetricTile
                label="Kalman estimate"
                symbol="x̂"
                value={
                  record.kalman.estimate === null
                    ? "—"
                    : formatNumber(record.kalman.estimate, 6)
                }
                accentClassName="text-estimate"
                hint="Posterior state estimate from the backend Kalman branch."
              />
              <MetricTile
                label="Kalman uncertainty"
                symbol="P"
                value={
                  record.kalman.uncertainty === null
                    ? "—"
                    : formatNumber(record.kalman.uncertainty, 6)
                }
                hint="Posterior variance — the filter's explicit statement of confidence. P is an uncertainty state, never plotted on the same axis as σ."
              />
              <MetricTile
                label="Kalman gain"
                symbol="K"
                value={
                  record.kalman.gain === null
                    ? "—"
                    : formatNumber(record.kalman.gain, 6)
                }
                hint="K = P⁻/(P⁻+R): how much of the innovation is folded into the estimate. Converges to 1/φ when Q = R."
              />
              <MetricTile
                label="Innovation"
                symbol="y"
                value={
                  record.kalman.innovation === null
                    ? "—"
                    : formatNumber(record.kalman.innovation, 6)
                }
                hint="Prediction residual y = z − x̂⁻ reported by the backend."
              />
              <MetricTile
                label="Innovation covariance"
                symbol="S"
                value={
                  record.kalman.innovation_covariance === null
                    ? "—"
                    : formatNumber(record.kalman.innovation_covariance, 6)
                }
                hint="S = P⁻ + R, the variance of the innovation."
              />
              <MetricTile
                label="Estimation error"
                symbol="|Δ − x̂|"
                value={
                  record.kalman.estimation_error === null
                    ? "—"
                    : formatNumber(record.kalman.estimation_error, 6)
                }
                hint="Deviation of the estimate from ground truth, as computed by the backend."
              />
              <MetricTile
                label="Synaptic negative"
                symbol="σ(T,NEG)"
                value={
                  record.sigma.thermal_negative === null
                    ? "—"
                    : formatNumber(record.sigma.thermal_negative, 6)
                }
                accentClassName="text-negative-channel"
                hint="Association strength of the THERMAL–NEGATIVE edge in the BDH-inspired abstraction. σ is an association-strength state."
              />
              <MetricTile
                label="Synaptic positive"
                symbol="σ(T,POS)"
                value={
                  record.sigma.thermal_positive === null
                    ? "—"
                    : formatNumber(record.sigma.thermal_positive, 6)
                }
                accentClassName="text-positive-channel"
                hint="Association strength of the competing THERMAL–POSITIVE edge."
              />
              <MetricTile
                label="Physical events"
                value={
                  record.physical_events.length
                    ? record.physical_events.join(" + ")
                    : "—"
                }
                hint="Telemetry-derived events from the quantum-clock simulator (physical observations)."
              />
              <MetricTile
                label="Semantic events"
                value={semantic}
                hint="Controlled semantic stimulus of the A → B → A protocol. Distinct from physical telemetry."
              />
            </div>
            <label className="readout flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={followLive}
                onChange={(e) => setFollowLive(e.target.checked)}
                className="accent-primary"
              />
              follow the latest tick of the active dataset
              {liveTick !== null ? ` (t = ${liveTick})` : ""}
            </label>
          </ConsolePanel>

          <div className="grid gap-4 xl:grid-cols-2">
            <ConsolePanel
              title="State estimation — Kalman branch"
              subtitle="Uncertainty P, gain K and innovation y as published by the backend."
            >
              <KalmanDiagnosticsChart
                records={records}
                phases={phases}
                currentTick={record.tick}
              />
              {records.some(
                (r) =>
                  r.clock.true_detuning_hz !== null ||
                  r.clock.measured_offset_hz !== null,
              ) ? (
                <DetuningChart
                  records={records}
                  phases={phases}
                  currentTick={record.tick}
                />
              ) : null}
              {record.clock.temperature_k !== null ||
              record.clock.magnetic_field_t !== null ? (
                <div className="grid grid-cols-2 gap-2">
                  <MetricTile
                    label="Temperature"
                    symbol="T"
                    unit="K"
                    value={
                      record.clock.temperature_k === null
                        ? "—"
                        : formatNumber(record.clock.temperature_k, 4)
                    }
                    hint="Clock body temperature in kelvin, from the telemetry stream."
                  />
                  <MetricTile
                    label="Magnetic field"
                    symbol="B"
                    unit="T"
                    value={
                      record.clock.magnetic_field_t === null
                        ? "—"
                        : formatNumber(record.clock.magnetic_field_t, 6)
                    }
                    hint="Ambient magnetic field in tesla, from the telemetry stream."
                  />
                </div>
              ) : null}
            </ConsolePanel>

            <ConsolePanel
              title="Synaptic dynamics — BDH-inspired fast weights"
              subtitle="Sparse association graph; edge intensity is the backend σ value at this tick."
            >
              <SynapseGraph record={record} />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <MetricTile
                  label="Memory difference"
                  symbol="σ(T,NEG) − σ(T,POS)"
                  value={
                    record.sigma.memory_difference === null
                      ? "—"
                      : formatNumber(record.sigma.memory_difference, 6)
                  }
                  hint="Reported by the backend. Positive means the THERMAL–NEGATIVE association currently dominates."
                />
                <MetricTile
                  label="Dominant association"
                  value={
                    record.sigma.memory_difference === null
                      ? "—"
                      : record.sigma.memory_difference > 0
                        ? "THERMAL–NEGATIVE"
                        : record.sigma.memory_difference < 0
                          ? "THERMAL–POSITIVE"
                          : "balanced"
                  }
                  hint="Read from the sign of the backend memory difference — stated in text so meaning does not depend on colour."
                />
              </div>
              <SigmaChart
                records={records}
                phases={phases}
                currentTick={record.tick}
              />
              <p className="text-xs text-muted-foreground">
                σ values come from the experiment stream (
                <span className="readout">sigma_thermal_negative</span>,{" "}
                <span className="readout">sigma_thermal_positive</span>,{" "}
                <span className="readout">sigma_thermal_magnetic</span>), never from
                browser-side computation.
              </p>
            </ConsolePanel>
          </div>

          <Timeline
            records={records}
            phases={phases}
            tick={record.tick}
            onTickChange={(t) => {
              setFollowLive(false);
              setTick(t);
            }}
          />

          <section aria-label="Kalman explanation" className="flex flex-col gap-3">
            <div className="flex items-baseline gap-3">
              <p className="panel-label">01 — Kalman explanation</p>
              <span aria-hidden className="hairline hidden flex-1 sm:block" />
            </div>
            <GoldenRatioCallout gain={record.kalman.gain} />
          </section>

          <section aria-label="Reading the console" className="flex flex-col gap-3">
            <div className="flex items-baseline gap-3">
              <p className="panel-label">02 — Reading the console</p>
              <span aria-hidden className="hairline hidden flex-1 sm:block" />
            </div>
            <WhatAmISeeing summary={summary.data ?? []} />
          </section>
        </>
      )}
    </div>
  );
}
