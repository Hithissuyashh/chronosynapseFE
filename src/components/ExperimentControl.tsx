import { useEffect, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { ExperimentRunFailure, replayExperiment } from "@/lib/api";
import type {
  ExperimentParams,
  ExperimentRunRequest,
  ExperimentRunResponse,
  ExperimentStatus,
} from "@/types/science";

const SCENARIO_LABEL =
  "THERMAL + NEGATIVE → THERMAL + POSITIVE → THERMAL + NEGATIVE";

/** Fallbacks used only for the control positions until the backend reports its own. */
const CONTROL_FALLBACK = { learning_rate: 0.1, decay: 0.05, phase_duration: 20 };

function scientific(value: number | null): string {
  return value === null ? "—" : value.toExponential(6);
}

function fixed(value: number | null, digits: number): string {
  return value === null ? "—" : value.toFixed(digits);
}

function CompletedRun({ experiment }: { experiment: ExperimentRunResponse }) {
  const rows = [
    ["Learning rate η", fixed(experiment.parameters.learning_rate, 3)],
    ["Synaptic decay u", fixed(experiment.parameters.decay, 3)],
    [
      "Phase duration",
      experiment.parameters.phase_duration === null
        ? "—"
        : `${experiment.parameters.phase_duration} ticks`,
    ],
    ["Scenario", experiment.scenario === "ABA" ? "A → B → A" : "—"],
    ["Total ticks", experiment.total_ticks === null ? "—" : String(experiment.total_ticks)],
  ] as const;
  const finalRows = [
    ["Kalman estimate", scientific(experiment.latest?.kalman.estimate ?? null)],
    ["Kalman uncertainty", scientific(experiment.latest?.kalman.uncertainty ?? null)],
    ["Kalman gain", fixed(experiment.latest?.kalman.gain ?? null, 6)],
    ["σ(T,NEG)", fixed(experiment.latest?.sigma.thermal_negative ?? null, 6)],
    ["σ(T,POS)", fixed(experiment.latest?.sigma.thermal_positive ?? null, 6)],
  ] as const;

  const renderRows = (items: ReadonlyArray<readonly [string, string]>) => (
    <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-[minmax(0,1fr)_auto]">
      {items.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="readout min-w-0 text-xs text-muted-foreground">{label}</dt>
          <dd className="readout break-words text-xs text-foreground sm:text-right">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );

  return (
    <section className="module-face border-primary/40 p-3.5" aria-label="Last completed run">
      <p className="readout text-[0.6875rem] text-muted-foreground">Last completed run</p>
      <h3 className="panel-label mt-1 text-primary">Experiment complete</h3>
      <div className="mt-3">{renderRows(rows)}</div>
      <h4 className="panel-label mt-4 border-t border-border pt-3 text-foreground">
        Final state
      </h4>
      <div className="mt-2">{renderRows(finalRows)}</div>
    </section>
  );
}

export function AbstractionBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className="readout cursor-help border border-primary/40 px-2 py-1 text-[0.6875rem] text-primary outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          BDH-INSPIRED EDUCATIONAL ABSTRACTION
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed">
        This is a conceptual educational abstraction inspired by the
        synaptic-memory mechanism described for BDH. It is not an official BDH
        implementation.
      </TooltipContent>
    </Tooltip>
  );
}

function StatusChip({ status }: { status: ExperimentStatus }) {
  const tone =
    status === "ERROR"
      ? "border-destructive/60 text-destructive"
      : status === "RUNNING"
        ? "border-primary/60 text-primary"
        : status === "COMPLETE"
          ? "border-primary/40 text-primary"
          : "border-border text-muted-foreground";
  return (
    <span
      role="status"
      aria-live="polite"
      className={`readout flex items-center gap-2 border px-2 py-1 text-[0.6875rem] ${tone}`}
    >
      {status === "RUNNING" ? (
        <span aria-hidden className="scan-bar h-2 w-8 border border-primary/40" />
      ) : null}
      {status}
    </span>
  );
}

interface Props {
  /** Parameters reported by the backend, if any. */
  params: ExperimentParams;
  /** Called with the replay response so it becomes the active dataset. */
  onReplayComplete: (response: ExperimentRunResponse) => void;
}

export function ExperimentControl({ params, onReplayComplete }: Props) {
  const initial = {
    eta: params.learning_rate ?? CONTROL_FALLBACK.learning_rate,
    decay: params.decay ?? CONTROL_FALLBACK.decay,
    duration: params.phase_duration ?? CONTROL_FALLBACK.phase_duration,
  };

  const [currentControls, setCurrentControls] = useState<ExperimentRunRequest>({
    learning_rate: initial.eta,
    decay: initial.decay,
    phase_duration: initial.duration,
    scenario: "ABA",
  });
  const initializedFromBackend = useRef(false);
  const [status, setStatus] = useState<ExperimentStatus>("IDLE");
  const [message, setMessage] = useState<string | null>(null);
  const [completedExperiment, setCompletedExperiment] =
    useState<ExperimentRunResponse | null>(null);

  // Adopt backend defaults once. Later summary refreshes must not overwrite edits.
  useEffect(() => {
    if (initializedFromBackend.current) return;
    if (
      params.learning_rate === null &&
      params.decay === null &&
      params.phase_duration === null
    ) {
      return;
    }
    setCurrentControls((controls) => ({
      ...controls,
      learning_rate: params.learning_rate ?? controls.learning_rate,
      decay: params.decay ?? controls.decay,
      phase_duration: params.phase_duration ?? controls.phase_duration,
    }));
    initializedFromBackend.current = true;
  }, [params.learning_rate, params.decay, params.phase_duration]);

  const reset = () => {
    setCurrentControls({
      learning_rate: initial.eta,
      decay: initial.decay,
      phase_duration: initial.duration,
      scenario: "ABA",
    });
    setStatus("IDLE");
    setMessage(null);
  };

  const run = async () => {
    const request: ExperimentRunRequest = { ...currentControls };
    setStatus("RUNNING");
    setMessage(null);
    let response: ExperimentRunResponse;
    try {
      response = await replayExperiment(request);
    } catch (e) {
      setStatus("ERROR");
      setMessage(
        e instanceof ExperimentRunFailure && e.kind === "not-connected"
          ? "Experiment engine not connected"
          : `Experiment run failed (${e instanceof Error ? e.message : "unknown error"})`,
      );
      return;
    }

    const reported = response.status?.toLowerCase() ?? null;
    if (reported && !["complete", "completed", "ok", "success"].includes(reported)) {
      setStatus("ERROR");
      setMessage(`Backend reported status "${response.status}" — no results loaded`);
      return;
    }
    if (!response.rows.length) {
      setStatus("ERROR");
      setMessage("Replay returned no observations — nothing was loaded");
      return;
    }

    setCompletedExperiment(response);
    onReplayComplete(response);

    const observations = response.total_ticks ?? response.rows.length;
    setStatus("COMPLETE");
    setMessage(`Replay complete — ${observations} observations from backend`);
  };


  const running = status === "RUNNING";

  return (
    <section
      className="glass-panel"
      aria-label="Experiment control"
      id="experiment-control"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="panel-label text-foreground">Experiment control</h2>
          <AbstractionBadge />
        </div>
        <StatusChip status={status} />
      </header>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="module-face flex flex-col gap-3 p-3.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="panel-label text-foreground">
                  Learning rate{" "}
                  <span className="readout normal-case tracking-normal">η</span>
                </span>
                <span id="eta-value" className="readout text-sm text-primary">
                  {currentControls.learning_rate.toFixed(3)}
                </span>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.005}
                value={[currentControls.learning_rate]}
                disabled={running}
                aria-label="Learning rate eta"
                aria-describedby="eta-value"
                onValueChange={([v]) =>
                  setCurrentControls((controls) => ({
                    ...controls,
                    learning_rate: v ?? controls.learning_rate,
                  }))
                }
              />
              <span className="readout text-[0.6875rem] text-muted-foreground">
                {params.learning_rate === null
                  ? "backend value not published"
                  : "write strength into synaptic state"}
              </span>
            </div>

            <div className="module-face flex flex-col gap-3 p-3.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="panel-label text-foreground">
                  Synaptic decay{" "}
                  <span className="readout normal-case tracking-normal">u</span>
                </span>
                <span id="decay-value" className="readout text-sm text-primary">
                  {currentControls.decay.toFixed(3)}
                </span>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.005}
                value={[currentControls.decay]}
                disabled={running}
                aria-label="Synaptic decay u"
                aria-describedby="decay-value"
                onValueChange={([v]) =>
                  setCurrentControls((controls) => ({
                    ...controls,
                    decay: v ?? controls.decay,
                  }))
                }
              />
              <span className="readout text-[0.6875rem] text-muted-foreground">
                {params.decay === null
                  ? "backend value not published"
                  : "weakening of written associations"}
              </span>
            </div>

            <label className="module-face flex flex-col gap-2 p-3.5">
              <span className="panel-label text-foreground">Phase duration</span>
              <input
                type="number"
                min={1}
                max={500}
                step={1}
                value={currentControls.phase_duration}
                disabled={running}
                onChange={(e) =>
                  setCurrentControls((controls) => ({
                    ...controls,
                    phase_duration: Math.max(1, Number(e.target.value) || 1),
                  }))
                }
                className="readout inset-well w-full px-2.5 py-2 text-sm text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <span className="readout text-[0.6875rem] text-muted-foreground">
                ticks per semantic regime
              </span>
            </label>

            <div className="module-face flex flex-col gap-2 p-3.5">
              <span className="panel-label text-foreground">Scenario</span>
              <span className="readout inset-well px-2.5 py-2 text-sm text-foreground">
                A → B → A
              </span>
              <span className="readout text-[0.6875rem] leading-relaxed text-muted-foreground">
                {SCENARIO_LABEL}
              </span>
            </div>
          </div>


          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={run}
              disabled={running}
              className="readout module-face border-primary/60 px-3.5 py-2 text-xs uppercase tracking-wider text-primary outline-none transition-colors hover:border-primary focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            >
              {running ? "Running replay…" : "Run experiment"}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={running}
              className="readout module-face px-3.5 py-2 text-xs uppercase tracking-wider text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            >
              Reset
            </button>
            {running ? (
              <span className="readout flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  aria-hidden
                  className="scan-bar h-1.5 w-24 border border-primary/30"
                />
                awaiting backend — no progress value is estimated
              </span>
            ) : null}
          </div>

          {message ? (
            <p
              role={status === "ERROR" ? "alert" : "status"}
              className={`readout border px-3 py-2 text-xs ${
                status === "ERROR"
                  ? "border-destructive/60 text-destructive"
                  : "border-primary/40 text-primary"
              }`}
            >
              {message}
            </p>
          ) : null}

          {completedExperiment ? (
            <CompletedRun experiment={completedExperiment} />
          ) : null}
        </div>

        <aside className="module-face flex min-w-0 flex-col gap-2 p-3.5">
          <h3 className="panel-label text-foreground">
            Change the rules. Watch the memory change.
          </h3>
          <ul className="flex flex-col gap-1.5 text-xs leading-relaxed text-muted-foreground">
            <li>
              Learning rate <span className="readout">η</span> controls how strongly
              new activity writes into synaptic state.
            </li>
            <li>
              Decay <span className="readout">u</span> controls how quickly previously
              written associations weaken.
            </li>
            <li>
              Phase duration controls how long each semantic regime is presented.
            </li>
          </ul>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Kalman filtering and synaptic fast-weight memory are two different
            mechanisms for maintaining state from streaming information. Kalman
            uncertainty <span className="readout">P</span> is an uncertainty state;{" "}
            <span className="readout">σ</span> is an association-strength state. They
            are never plotted on the same numerical axis.
          </p>
        </aside>
      </div>
    </section>
  );
}
