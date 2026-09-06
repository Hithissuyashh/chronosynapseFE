import { Slider } from "@/components/ui/slider";
import { PHASE_SEMANTICS, type PhaseWindow, type ScienceRecord } from "@/types/science";

const PHASE_CLASS: Record<string, string> = {
  A: "bg-phase-a",
  B: "bg-phase-b",
  C: "bg-phase-c",
};

/** Chart 3 — A/B/C phase timeline and shared tick scrubber. */
export function Timeline({
  records,
  phases,
  tick,
  onTickChange,
}: {
  records: ScienceRecord[];
  phases: PhaseWindow[];
  tick: number;
  onTickChange: (t: number) => void;
}) {
  const first = records[0]?.tick ?? 1;
  const last = records[records.length - 1]?.tick ?? 1;
  const span = Math.max(1, last - first + 1);
  const current = records.find((r) => r.tick === tick);

  return (
    <section className="panel-surface px-4 py-3" aria-label="Experiment timeline">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="panel-label text-foreground">
          Chart 3 — Timeline · A → B → A protocol
        </h2>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {phases.map((p) => (
            <span key={`${p.phase}-${p.start}`} className="flex items-center gap-1.5">
              <span aria-hidden className={`h-2 w-2 ${PHASE_CLASS[p.phase]}`} />
              <span className="readout">
                Phase {p.phase} · t{p.start}–{p.end} ·{" "}
                {PHASE_SEMANTICS[p.phase].join(" + ")}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <div className="relative h-2 w-full overflow-hidden rounded-sm border border-border">
          {phases.map((p) => (
            <div
              key={`${p.phase}-${p.start}`}
              className={`absolute top-0 h-full opacity-45 ${PHASE_CLASS[p.phase]}`}
              style={{
                left: `${((p.start - first) / span) * 100}%`,
                width: `${((p.end - p.start + 1) / span) * 100}%`,
              }}
            />
          ))}
        </div>

        <Slider
          className="mt-3"
          aria-label="Experiment tick"
          min={first}
          max={last}
          step={1}
          value={[tick]}
          onValueChange={(vals) => onTickChange(vals[0] ?? tick)}
        />

        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
          <span className="readout text-xs text-muted-foreground">tick = {first}</span>
          <span className="readout text-sm text-foreground">
            tick = {tick} · phase {current?.phase ?? "—"} · semantic{" "}
            {current?.semantic_events.length
              ? current.semantic_events.join(" + ")
              : current?.phase
                ? `${PHASE_SEMANTICS[current.phase].join(" + ")} (protocol)`
                : "—"}
          </span>
          <span className="readout text-xs text-muted-foreground">tick = {last}</span>
        </div>
      </div>
    </section>
  );
}
