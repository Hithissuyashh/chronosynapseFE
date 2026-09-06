/**
 * Data contract for the live FastAPI science backend.
 *
 * Every numeric field here is read from the backend response. When a field is
 * absent from the payload it stays `null` and the UI prints "—" rather than
 * substituting a frontend-computed value.
 */

export const CONCEPTS = ["THERMAL", "NEGATIVE", "POSITIVE", "MAGNETIC"] as const;
export type ConceptId = (typeof CONCEPTS)[number];

export type Phase = "A" | "B" | "C";

/** Controlled semantic stimulus of the A → B → A protocol (experiment design). */
export const PHASE_SEMANTICS: Record<Phase, ConceptId[]> = {
  A: ["THERMAL", "NEGATIVE"],
  B: ["THERMAL", "POSITIVE"],
  C: ["THERMAL", "NEGATIVE"],
};

export interface KalmanState {
  estimate: number | null;
  uncertainty: number | null;
  innovation: number | null;
  innovation_covariance: number | null;
  gain: number | null;
  estimation_error: number | null;
}

export interface SynapticState {
  thermal_negative: number | null;
  thermal_positive: number | null;
  thermal_magnetic: number | null;
  /** σ(T,NEG) − σ(T,POS) — taken from the backend when it publishes it. */
  memory_difference: number | null;
}

/** Physical telemetry, when the backend exposes it. */
export interface ClockState {
  temperature_k: number | null;
  magnetic_field_t: number | null;
  true_detuning_hz: number | null;
  measured_offset_hz: number | null;
}

export interface ScienceRecord {
  tick: number;
  phase: Phase | null;
  /** Raw telemetry-derived event labels reported by the backend. */
  physical_events: string[];
  /** Controlled semantic stimulus labels reported by the backend. */
  semantic_events: string[];
  clock: ClockState;
  kalman: KalmanState;
  sigma: SynapticState;
}

export interface PhaseWindow {
  phase: Phase;
  start: number;
  end: number;
}

export interface HealthStatus {
  online: boolean;
  detail: string;
}

export interface SummaryField {
  label: string;
  value: string;
}

/** Reciprocal golden ratio 1/φ — the steady-state scalar gain for Q = R. */
export const INVERSE_PHI = 2 / (1 + Math.sqrt(5));

/* ------------------------------------------------- experiment run contract */

export type Scenario = "ABA";

/** Body posted to POST /api/experiment/run. */
export interface ExperimentRunRequest {
  learning_rate: number;
  decay: number;
  phase_duration: number;
  scenario: Scenario;
}

export type ExperimentStatus = "IDLE" | "RUNNING" | "COMPLETE" | "ERROR";

/** Whatever the backend replies with; nothing is invented client-side. */
export interface ExperimentRunResponse {
  /** Raw parsed JSON body, when the backend returns one. */
  raw: unknown;
  /** Backend-reported run status (e.g. "success"), when present. */
  status: string | null;
  /** Backend-reported mode (e.g. "recorded_replay"), when present. */
  mode: string | null;
  /** Scenario confirmed by the completed backend run. */
  scenario: Scenario | null;
  /** Authoritative parameters returned by the completed backend run. */
  parameters: ExperimentParams;
  /** Full replay dataset returned by the backend — the active dataset. */
  rows: ScienceRecord[];
  /** Authoritative final state returned by the completed backend run. */
  latest: ScienceRecord | null;
  /** Total ticks reported by the response, or by its final-state tick. */
  total_ticks: number | null;
}


/** Distinguishes "endpoint missing" (404) from other failures. */
export interface ExperimentRunError {
  kind: "not-connected" | "failed";
  message: string;
}

/** Current experiment parameters, only when the backend publishes them. */
export interface ExperimentParams {
  learning_rate: number | null;
  decay: number | null;
  phase_duration: number | null;
}
