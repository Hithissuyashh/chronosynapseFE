import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { StatusBadge, type StatusTone } from "@/components/system/Panels";

export type StageKind =
  | "INPUT"
  | "PROCESS"
  | "ESTIMATION"
  | "MEMORY"
  | "STREAM"
  | "SERVICE"
  | "VISUALIZATION";

export type Provenance = "LIVE DATA" | "COMPUTED DATA" | "EDUCATIONAL ABSTRACTION";

export interface Stage {
  id: string;
  kind: StageKind;
  title: string;
  summary: string;
  /** What data enters this stage. */
  input: string;
  /** What data leaves this stage. */
  output: string;
  provenance: Provenance;
  /** Which part of the live console this stage ends up driving. */
  console: string;
  /** ids of stages this feeds into. */
  next: string[];
}

const KIND_ACCENT: Record<StageKind, string> = {
  INPUT: "text-truth",
  PROCESS: "text-thermal-channel",
  ESTIMATION: "text-estimate",
  MEMORY: "text-positive-channel",
  STREAM: "text-magnetic-channel",
  SERVICE: "text-negative-channel",
  VISUALIZATION: "text-primary",
};

export const PROVENANCE_TONE: Record<Provenance, StatusTone> = {
  "LIVE DATA": "live",
  "COMPUTED DATA": "computed",
  "EDUCATIONAL ABSTRACTION": "abstraction",
};

export function PipelineNode({
  stage,
  state,
  active,
  onSelect,
  onHover,
  index,
}: {
  stage: Stage;
  /** "selected" | "linked" (upstream/downstream of selection) | "dim" | "base" */
  state: "selected" | "linked" | "dim" | "base";
  active: boolean;
  onSelect: () => void;
  onHover: (hovering: boolean) => void;
  index: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={state === "selected"}
      onClick={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      className={cn(
        "module-face stage-reveal min-w-0 px-3 py-3 text-left outline-none transition-all duration-300 focus-visible:ring-1 focus-visible:ring-ring",
        state === "selected" && "border-primary/70 shadow-[0_0_0_1px_var(--primary)]",
        state === "linked" && "border-primary/40",
        state === "dim" && "opacity-45",
      )}
      style={{ animationDelay: `${Math.min(index * 45, 600)}ms` }}
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className={cn("panel-label", KIND_ACCENT[stage.kind])}>{stage.kind}</span>
        <span
          aria-hidden
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            active ? "bg-primary led-live" : "bg-border",
          )}
        />
      </div>
      <p className="readout mt-1.5 break-words text-xs text-foreground">
        {stage.title}
      </p>
    </button>
  );
}

export function PipelineConnector({
  lit,
  active,
  className,
  label,
}: {
  lit: boolean;
  active: boolean;
  className?: string;
  label?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("relative h-6 w-px justify-self-center overflow-hidden", className)}
    >
      <div
        className={cn(
          "absolute inset-0 transition-colors duration-300",
          lit ? "bg-primary/70" : "bg-border",
        )}
      />
      {active ? (
        <div
          className="absolute left-0 top-0 h-2 w-px bg-primary"
          style={{
            animation: "packet-drop 1.6s linear infinite",
          }}
        />
      ) : null}
      {label ? <span className="sr-only">{label}</span> : null}
    </div>
  );
}

export function StageDetail({
  stage,
  children,
}: {
  stage: Stage;
  children?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={cn("panel-label", KIND_ACCENT[stage.kind])}>{stage.kind}</span>
        <StatusBadge tone={PROVENANCE_TONE[stage.provenance]}>
          {stage.provenance}
        </StatusBadge>
      </div>
      <h3 className="display-type mt-2 text-xl text-foreground">{stage.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {stage.summary}
      </p>
      <dl className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="inset-well min-w-0 px-3 py-2">
          <dt className="panel-label">Data in</dt>
          <dd className="readout mt-1 break-words text-xs text-foreground">
            {stage.input}
          </dd>
        </div>
        <div className="inset-well min-w-0 px-3 py-2">
          <dt className="panel-label">Data out</dt>
          <dd className="readout mt-1 break-words text-xs text-foreground">
            {stage.output}
          </dd>
        </div>
      </dl>
      <div className="inset-well mt-2 min-w-0 px-3 py-2">
        <p className="panel-label">Where it shows up in the console</p>
        <p className="mt-1 break-words text-xs leading-relaxed text-muted-foreground">
          {stage.console}
        </p>
      </div>
      {children}
    </div>
  );
}
