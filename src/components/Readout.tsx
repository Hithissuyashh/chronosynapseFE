import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function formatNumber(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs !== 0 && (abs < 1e-3 || abs >= 1e5)) return value.toExponential(3);
  return value.toFixed(digits);
}

interface ReadoutProps {
  label: string;
  value: string;
  unit?: string;
  /** Scientific explanation surfaced via tooltip and keyboard focus. */
  hint: string;
  symbol?: string;
  accentClassName?: string;
}

export function Readout({
  label,
  value,
  unit,
  hint,
  symbol,
  accentClassName,
}: ReadoutProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          tabIndex={0}
          className="group flex min-w-0 flex-col gap-1 overflow-hidden rounded-sm border border-border/70 bg-card px-3 py-2 outline-none transition-colors hover:border-primary/50 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-ring"
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="panel-label leading-tight">{label}</span>
            {symbol ? (
              <span className="readout text-[0.6875rem] text-muted-foreground">
                {symbol}
              </span>
            ) : null}
          </div>
          <div className="flex min-w-0 items-baseline gap-1.5">
            <span
              className={`readout min-w-0 break-words text-sm text-foreground ${accentClassName ?? ""}`}
            >
              {value}
            </span>
            {unit ? (
              <span className="readout text-[0.6875rem] text-muted-foreground">
                {unit}
              </span>
            ) : null}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
        {hint}
      </TooltipContent>
    </Tooltip>
  );
}

export function PanelSection({
  title,
  subtitle,
  aside,
  children,
}: {
  title: string;
  subtitle?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel-surface flex min-w-0 flex-col">
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
