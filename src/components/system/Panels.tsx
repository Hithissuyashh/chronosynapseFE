/**
 * Shared visual component system used across every page.
 * Purely presentational — no scientific values originate here.
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function GlassPanel({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("glass-panel min-w-0", className)} {...rest}>
      {children}
    </div>
  );
}

/** Opaque instrument panel with a titled header rail. */
export function ConsolePanel({
  title,
  subtitle,
  aside,
  className,
  children,
  id,
}: {
  title: string;
  subtitle?: string;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className={cn("panel-surface flex min-w-0 flex-col", className)}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="panel-label text-foreground">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {aside}
      </header>
      <div className="flex min-w-0 flex-col gap-4 p-4">{children}</div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  aside,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? <p className="panel-label">{eyebrow}</p> : null}
        <h2 className="display-type mt-2 text-2xl text-foreground sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {aside}
    </div>
  );
}

/** Monospace label for a scientific quantity, with a tooltip explanation. */
export function ScientificLabel({
  label,
  symbol,
  hint,
  className,
}: {
  label: string;
  symbol?: string;
  hint: string;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={cn(
            "panel-label inline-flex min-w-0 cursor-help items-baseline gap-1.5 outline-none focus-visible:ring-1 focus-visible:ring-ring",
            className,
          )}
        >
          <span className="min-w-0 leading-tight">{label}</span>
          {symbol ? <span className="text-foreground/70">{symbol}</span> : null}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
        {hint}
      </TooltipContent>
    </Tooltip>
  );
}

/** Instrument-module tile: inset display face, monospace value. */
export function MetricTile({
  label,
  symbol,
  value,
  unit,
  hint,
  accentClassName,
  className,
}: {
  label: string;
  symbol?: string;
  value: string;
  unit?: string;
  hint: string;
  accentClassName?: string;
  className?: string;
}) {
  return (
    <div className={cn("module-face flex min-w-0 flex-col gap-2 p-3", className)}>
      <div className="flex min-w-0 items-baseline justify-between gap-2">
        <ScientificLabel label={label} hint={hint} />
        {symbol ? (
          <span className="readout shrink-0 text-[0.6875rem] text-muted-foreground">
            {symbol}
          </span>
        ) : null}
      </div>
      <div className="inset-well flex min-w-0 items-baseline gap-1.5 px-2.5 py-1.5">
        <span
          className={cn(
            "readout min-w-0 break-words text-sm text-foreground",
            accentClassName,
          )}
        >
          {value}
        </span>
        {unit ? (
          <span className="readout shrink-0 text-[0.6875rem] text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export type StatusTone = "live" | "computed" | "abstraction" | "idle" | "error";

const TONE_CLASS: Record<StatusTone, string> = {
  live: "border-primary/50 text-primary",
  computed: "border-truth/40 text-truth",
  abstraction: "border-positive-channel/50 text-positive-channel",
  idle: "border-border text-muted-foreground",
  error: "border-destructive/60 text-destructive",
};

export function StatusBadge({
  tone = "idle",
  children,
  led,
  className,
}: {
  tone?: StatusTone;
  children: ReactNode;
  led?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "readout inline-flex items-center gap-2 rounded-sm border px-2 py-1 text-[0.6875rem] uppercase tracking-wider",
        TONE_CLASS[tone],
        className,
      )}
    >
      {led ? (
        <span
          aria-hidden
          className={cn(
            "h-1.5 w-1.5 rounded-full bg-current",
            tone === "live" ? "led-live" : "",
          )}
        />
      ) : null}
      {children}
    </span>
  );
}
