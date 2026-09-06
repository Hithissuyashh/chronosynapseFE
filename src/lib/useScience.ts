/**
 * Shared live-science data layer.
 *
 * Every page (overview, console, pipeline) reads from these queries so the
 * whole site renders the same backend state. Nothing here computes scientific
 * values: it only fetches, merges on the backend tick key, and exposes state.
 */

import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchComparison,
  fetchExperiment,
  fetchHealth,
  fetchKalman,
  fetchLatest,
  fetchMemory,
  fetchSummary,
  paramsFromSummary,
  phaseWindows,
} from "@/lib/api";
import type { ExperimentRunResponse, ScienceRecord } from "@/types/science";

/** Merge series from several endpoints on the shared tick key. */
export function mergeByTick(series: ScienceRecord[][]): ScienceRecord[] {
  const byTick = new Map<number, ScienceRecord>();
  for (const list of series) {
    for (const r of list) {
      const prev = byTick.get(r.tick);
      if (!prev) {
        byTick.set(r.tick, r);
        continue;
      }
      byTick.set(r.tick, {
        tick: r.tick,
        phase: prev.phase ?? r.phase,
        physical_events: prev.physical_events.length
          ? prev.physical_events
          : r.physical_events,
        semantic_events: prev.semantic_events.length
          ? prev.semantic_events
          : r.semantic_events,
        clock: {
          temperature_k: prev.clock.temperature_k ?? r.clock.temperature_k,
          magnetic_field_t: prev.clock.magnetic_field_t ?? r.clock.magnetic_field_t,
          true_detuning_hz: prev.clock.true_detuning_hz ?? r.clock.true_detuning_hz,
          measured_offset_hz:
            prev.clock.measured_offset_hz ?? r.clock.measured_offset_hz,
        },
        kalman: {
          estimate: prev.kalman.estimate ?? r.kalman.estimate,
          uncertainty: prev.kalman.uncertainty ?? r.kalman.uncertainty,
          innovation: prev.kalman.innovation ?? r.kalman.innovation,
          innovation_covariance:
            prev.kalman.innovation_covariance ?? r.kalman.innovation_covariance,
          gain: prev.kalman.gain ?? r.kalman.gain,
          estimation_error: prev.kalman.estimation_error ?? r.kalman.estimation_error,
        },
        sigma: {
          thermal_negative: prev.sigma.thermal_negative ?? r.sigma.thermal_negative,
          thermal_positive: prev.sigma.thermal_positive ?? r.sigma.thermal_positive,
          thermal_magnetic: prev.sigma.thermal_magnetic ?? r.sigma.thermal_magnetic,
          memory_difference: prev.sigma.memory_difference ?? r.sigma.memory_difference,
        },
      });
    }
  }
  return [...byTick.values()].sort((a, b) => a.tick - b.tick);
}

async function fetchSeries(strict: boolean): Promise<ScienceRecord[]> {
  const guard = (p: Promise<ScienceRecord[]>) =>
    strict ? p : p.catch(() => [] as ScienceRecord[]);
  const [experiment, comparison, kalman, memory] = await Promise.all([
    guard(fetchExperiment()),
    guard(fetchComparison()),
    guard(fetchKalman()),
    guard(fetchMemory()),
  ]);
  return mergeByTick([experiment, comparison, kalman, memory]);
}

/** Live backend health only — cheap enough for the persistent nav indicator. */
export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    refetchInterval: 10_000,
  });
}

/** Single source of truth for an interactive replay dataset, when one exists. */
export const REPLAY_KEY = ["replay"] as const;

export function useScience() {
  const queryClient = useQueryClient();
  const health = useHealth();
  const online = health.data?.online === true;

  /**
   * Cache-backed replay dataset. Written once by the experiment control after a
   * successful POST /api/experiment/replay; every page reads it from here.
   */
  const replay = useQuery<ExperimentRunResponse | null>({
    queryKey: REPLAY_KEY,
    queryFn: () => null,
    initialData: null,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const replayData = replay.data ?? null;
  const replayActive = replayData !== null && replayData.rows.length > 0;

  const series = useQuery({
    queryKey: ["series"],
    queryFn: () => fetchSeries(false),
    refetchInterval: replayActive ? false : 5_000,
    enabled: online,
  });

  const latest = useQuery({
    queryKey: ["latest"],
    queryFn: fetchLatest,
    refetchInterval: replayActive ? false : 3_000,
    enabled: online,
  });

  const summary = useQuery({
    queryKey: ["summary"],
    queryFn: fetchSummary,
    enabled: online,
  });

  const records = replayActive ? replayData.rows : (series.data ?? []);
  const phases = useMemo(() => phaseWindows(records), [records]);
  const experimentParams = useMemo(
    () => paramsFromSummary(summary.data ?? []),
    [summary.data],
  );

  /** Adopt a replay response as the active dataset for the whole app. */
  const applyReplay = (response: ExperimentRunResponse) => {
    queryClient.setQueryData<ExperimentRunResponse | null>(REPLAY_KEY, response);
  };

  /**
   * Force a real re-read of every stream after a backend run, even if a query
   * is currently disabled because health had not answered yet.
   */
  const refreshAll = async () => {
    await health.refetch();
    const [seriesRes, latestRes, summaryRes] = await Promise.allSettled([
      queryClient.fetchQuery({
        queryKey: ["series"],
        queryFn: () => fetchSeries(true),
        staleTime: 0,
      }),
      queryClient.fetchQuery({
        queryKey: ["latest"],
        queryFn: fetchLatest,
        staleTime: 0,
      }),
      queryClient.fetchQuery({
        queryKey: ["summary"],
        queryFn: fetchSummary,
        staleTime: 0,
      }),
    ]);
    const failed = [seriesRes, latestRes, summaryRes].filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );
    if (failed.length) {
      const first = failed[0]!.reason;
      throw new Error(
        `could not reload telemetry (${first instanceof Error ? first.message : "unknown error"})`,
      );
    }
  };

  const latestRecord = replayActive
    ? (replayData.latest ?? records[records.length - 1] ?? null)
    : (latest.data ?? null);
  const liveTick = latestRecord?.tick ?? records[records.length - 1]?.tick ?? null;

  return {
    health,
    series,
    latest,
    latestRecord,
    summary,
    records,
    phases,
    experimentParams,
    liveTick,
    replay: replayData,
    replayActive,
    applyReplay,
    offline: health.data ? !health.data.online : false,
    refreshing: replayActive
      ? false
      : series.isFetching || latest.isFetching,
    refreshAll,
  };
}
