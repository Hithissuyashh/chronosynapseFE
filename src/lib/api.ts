/**
 * Typed client for the live FastAPI science backend.
 *
 * The browser talks to the backend directly (it runs on the researcher's
 * machine at http://127.0.0.1:8000 by default; override with
 * VITE_SCIENCE_API_URL). No values are synthesised here: the client only
 * parses, it never computes scientific quantities.
 */

import type {
  ClockState,
  ExperimentParams,
  ExperimentRunError,
  ExperimentRunRequest,
  ExperimentRunResponse,
  HealthStatus,
  KalmanState,
  Phase,
  PhaseWindow,
  ScienceRecord,
  SummaryField,
  SynapticState,
} from "@/types/science";

export const API_BASE = (
  (import.meta.env["VITE_SCIENCE_API_URL"] as string | undefined) ??
  (import.meta.env["VITE_API_URL"] as string | undefined) ??
  "http://127.0.0.1:8000"
).replace(/\/$/, "");

type Json = Record<string, unknown>;

async function getJson(path: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.json();
}

/* ---------------------------------------------------------------- parsing */

function isObj(v: unknown): v is Json {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Flatten one level of nesting so `{kalman:{gain:…}}` and flat rows both work. */
function flatten(row: Json): Json {
  const out: Json = {};
  for (const [k, v] of Object.entries(row)) {
    if (isObj(v)) {
      for (const [k2, v2] of Object.entries(v)) {
        out[`${k}_${k2}`] = v2;
        if (!(k2 in out)) out[k2] = v2;
      }
    }
    out[k] = v;
  }
  return out;
}

function num(row: Json, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) {
      return Number(v);
    }
  }
  return null;
}

function labels(row: Json, ...keys: string[]): string[] {
  for (const k of keys) {
    const v = row[k];
    if (Array.isArray(v)) return v.map(String).filter(Boolean);
    if (typeof v === "string" && v.trim() !== "") {
      return v
        .split(/[,+|]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function phaseOf(row: Json): Phase | null {
  const v = row["phase"] ?? row["experiment_phase"];
  if (typeof v !== "string") return null;
  const p = v.trim().toUpperCase().slice(-1);
  return p === "A" || p === "B" || p === "C" ? p : null;
}

/** Pull the record array out of whatever envelope the endpoint uses. */
function rowsOf(payload: unknown): Json[] {
  if (Array.isArray(payload)) return payload.filter(isObj);
  if (!isObj(payload)) return [];
  for (const key of ["records", "data", "items", "rows", "results", "comparison"]) {
    const v = payload[key];
    if (Array.isArray(v)) return v.filter(isObj);
  }
  return [payload];
}

function kalmanOf(row: Json): KalmanState {
  return {
    estimate: num(row, "kalman_estimate", "estimate", "estimate_hz", "x_hat"),
    uncertainty: num(row, "kalman_uncertainty", "uncertainty", "P"),
    innovation: num(row, "kalman_innovation", "innovation", "y"),
    innovation_covariance: num(
      row,
      "kalman_innovation_covariance",
      "innovation_covariance",
      "S",
    ),
    gain: num(row, "kalman_gain", "gain", "K"),
    estimation_error: num(row, "estimation_error", "error"),
  };
}

function sigmaOf(row: Json): SynapticState {
  const neg = num(row, "sigma_thermal_negative", "sigma_negative");
  const pos = num(row, "sigma_thermal_positive", "sigma_positive");
  const backendDiff = num(row, "memory_difference", "sigma_difference");
  return {
    thermal_negative: neg,
    thermal_positive: pos,
    thermal_magnetic: num(row, "sigma_thermal_magnetic", "sigma_magnetic"),
    memory_difference: backendDiff,
  };
}

function clockOf(row: Json): ClockState {
  return {
    temperature_k: num(row, "temperature_k", "temperature"),
    magnetic_field_t: num(row, "magnetic_field_t", "magnetic_field"),
    true_detuning_hz: num(row, "true_detuning_hz", "true_detuning"),
    measured_offset_hz: num(row, "measured_offset_hz", "measured_offset", "measurement"),
  };
}

export function toRecord(raw: Json, fallbackTick: number): ScienceRecord {
  const row = flatten(raw);
  return {
    tick: num(row, "tick", "time", "t", "step", "index") ?? fallbackTick,
    phase: phaseOf(row),
    physical_events: labels(row, "physical_events", "physical_event", "events_physical"),
    semantic_events: labels(
      row,
      "semantic_events",
      "semantic_event",
      "concepts",
      "events",
    ),
    clock: clockOf(row),
    kalman: kalmanOf(row),
    sigma: sigmaOf(row),
  };
}

export function toRecords(payload: unknown): ScienceRecord[] {
  return rowsOf(payload)
    .map((row, i) => toRecord(row, i + 1))
    .sort((a, b) => a.tick - b.tick);
}

/** Contiguous phase windows exactly as reported — boundaries are not smoothed. */
export function phaseWindows(records: ScienceRecord[]): PhaseWindow[] {
  const out: PhaseWindow[] = [];
  for (const r of records) {
    if (!r.phase) continue;
    const last = out[out.length - 1];
    if (last && last.phase === r.phase && r.tick === last.end + 1) {
      last.end = r.tick;
    } else {
      out.push({ phase: r.phase, start: r.tick, end: r.tick });
    }
  }
  return out;
}

/* -------------------------------------------------------------- endpoints */

export async function fetchHealth(): Promise<HealthStatus> {
  try {
    const payload = await getJson("/api/health");
    const row = isObj(payload) ? payload : {};
    const status = String(row["status"] ?? row["state"] ?? "ok");
    return { online: true, detail: status };
  } catch (e) {
    return { online: false, detail: e instanceof Error ? e.message : "unreachable" };
  }
}

export async function fetchExperiment(): Promise<ScienceRecord[]> {
  return toRecords(await getJson("/api/experiment"));
}

export async function fetchComparison(): Promise<ScienceRecord[]> {
  return toRecords(await getJson("/api/comparison"));
}

export async function fetchKalman(): Promise<ScienceRecord[]> {
  return toRecords(await getJson("/api/kalman"));
}

export async function fetchMemory(): Promise<ScienceRecord[]> {
  return toRecords(await getJson("/api/memory"));
}

export async function fetchLatest(): Promise<ScienceRecord | null> {
  const rows = rowsOf(await getJson("/api/experiment/latest"));
  const last = rows[rows.length - 1];
  return last ? toRecord(last, 0) : null;
}

/** Summary is rendered generically: whatever scalar fields the backend sends. */
export async function fetchSummary(): Promise<SummaryField[]> {
  const payload = await getJson("/api/summary");
  const row = isObj(payload) ? flatten(payload) : {};
  return Object.entries(row)
    .filter(([, v]) => typeof v === "number" || typeof v === "string")
    .map(([label, v]) => ({
      label,
      value:
        typeof v === "number"
          ? Math.abs(v) !== 0 && (Math.abs(v) < 1e-3 || Math.abs(v) >= 1e5)
            ? v.toExponential(4)
            : String(v)
          : String(v),
    }));
}

/* --------------------------------------------------- experiment execution */

export class ExperimentRunFailure extends Error implements ExperimentRunError {
  kind: ExperimentRunError["kind"];
  constructor(kind: ExperimentRunError["kind"], message: string) {
    super(message);
    this.kind = kind;
    this.name = "ExperimentRunFailure";
  }
}

/**
 * POST /api/experiment/replay — asks the backend to replay the recorded
 * experiment with the supplied parameters. A 404 means the replay engine is
 * not wired up yet; no results are fabricated in that case.
 */
export async function replayExperiment(
  body: ExperimentRunRequest,
): Promise<ExperimentRunResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/experiment/replay`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        learning_rate: body.learning_rate,
        decay: body.decay,
        phase_duration: body.phase_duration,
        scenario: body.scenario,
      }),
    });
  } catch (e) {
    throw new ExperimentRunFailure(
      "failed",
      e instanceof Error ? e.message : "network error",
    );
  }
  if (res.status === 404 || res.status === 405 || res.status === 501) {
    throw new ExperimentRunFailure("not-connected", `HTTP ${res.status}`);
  }
  if (!res.ok) {
    throw new ExperimentRunFailure("failed", `HTTP ${res.status}`);
  }
  let raw: unknown = null;
  try {
    raw = await res.json();
  } catch {
    raw = null;
  }
  const status =
    isObj(raw) && typeof raw["status"] === "string" ? (raw["status"] as string) : null;
  const mode = isObj(raw) && typeof raw["mode"] === "string" ? raw["mode"] : null;
  const scenarioValue = isObj(raw) ? raw["scenario"] : null;
  const scenario = scenarioValue === "ABA" ? scenarioValue : null;
  const parameterRow = isObj(raw) && isObj(raw["parameters"]) ? raw["parameters"] : {};
  const parameters: ExperimentParams = {
    learning_rate: num(parameterRow, "learning_rate"),
    decay: num(parameterRow, "decay"),
    phase_duration: num(parameterRow, "phase_duration"),
  };
  const rows =
    isObj(raw) && Array.isArray(raw["rows"]) ? toRecords(raw["rows"]) : [];
  const latestRow = isObj(raw) && isObj(raw["latest"]) ? raw["latest"] : null;
  const latestTick = latestRow
    ? num(flatten(latestRow), "tick", "time", "t", "step", "index")
    : null;
  const latest =
    latestRow && latestTick !== null
      ? toRecord(latestRow, latestTick)
      : (rows[rows.length - 1] ?? null);
  const totalTicks = isObj(raw)
    ? (num(raw, "total_ticks", "tick_count") ?? (rows.length || latestTick))
    : null;
  return {
    raw,
    status,
    mode,
    scenario,
    parameters,
    rows,
    latest,
    total_ticks: totalTicks,
  };
}


/**
 * Current experiment parameters, when the backend publishes them in
 * /api/summary. Absent fields stay null — the UI never guesses.
 */
export function paramsFromSummary(fields: SummaryField[]): ExperimentParams {
  const pick = (...keys: string[]): number | null => {
    for (const k of keys) {
      const hit = fields.find((f) => f.label.toLowerCase() === k);
      if (hit && Number.isFinite(Number(hit.value))) return Number(hit.value);
    }
    return null;
  };
  return {
    learning_rate: pick("learning_rate", "eta", "learning_rate_eta"),
    decay: pick("decay", "u", "synaptic_decay", "decay_u"),
    phase_duration: pick("phase_duration", "phase_length", "ticks_per_phase"),
  };
}
