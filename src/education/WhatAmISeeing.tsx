import { useState } from "react";
import type { SummaryField } from "@/types/science";

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. Physical system",
    body: (
      <>
        The quantum-clock simulator produces an evolving physical observation
        stream: temperature, ambient magnetic field, and a noisy frequency offset
        of the clock transition. These are the <em>physical telemetry</em> events.
      </>
    ),
  },
  {
    title: "2. Kalman branch",
    body: (
      <>
        A scalar Kalman filter maintains an estimate and an explicit uncertainty.
        Predict: <span className="readout">x̂⁻ = x̂</span>,{" "}
        <span className="readout">P⁻ = P + Q</span>. Update:{" "}
        <span className="readout">y = z − x̂⁻</span>,{" "}
        <span className="readout">S = P⁻ + R</span>,{" "}
        <span className="readout">K = P⁻/S</span>,{" "}
        <span className="readout">x̂ = x̂⁻ + K·y</span>,{" "}
        <span className="readout">P = (1 − K)·P⁻</span>. The equations live in the
        Python backend; the UI only displays what it reports.
      </>
    ),
  },
  {
    title: "3. Event representation",
    body: (
      <>
        Physical observations are mapped to semantic concepts (THERMAL, NEGATIVE,
        POSITIVE, MAGNETIC). Physical telemetry events and the controlled
        semantic stimuli of the protocol are shown separately, because they are
        not the same thing.
      </>
    ),
  },
  {
    title: "4. Synaptic memory (BDH-inspired educational abstraction)",
    body: (
      <>
        Recent co-activity modifies association strength:{" "}
        <span className="readout">σ_ij ← (1 − u)·σ_ij + η·a_i·a_j</span>. This is a
        BDH-inspired educational abstraction, not the official BDH
        implementation, and it is not mathematically equivalent to Kalman
        filtering: it carries no uncertainty covariance.
      </>
    ),
  },
  {
    title: "5. Interference experiment (A → B → A)",
    body: (
      <>
        Phase A stimulates THERMAL + NEGATIVE, phase B swaps in THERMAL +
        POSITIVE, phase C returns to THERMAL + NEGATIVE. The learner observes
        retention, interference from the competing association, and relearning —
        with the actual backend phase boundaries preserved.
      </>
    ),
  },
];

export function WhatAmISeeing({ summary }: { summary: SummaryField[] }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="panel-surface" aria-label="Educational explanation">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <span className="panel-label text-foreground">What am I seeing?</span>
        <span className="readout text-xs text-muted-foreground">
          {open ? "[ − collapse ]" : "[ + expand ]"}
        </span>
      </button>

      {open ? (
        <div className="grid gap-4 border-t border-border p-4 lg:grid-cols-2">
          {SECTIONS.map((s) => (
            <article key={s.title}>
              <h3 className="panel-label text-foreground">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </article>
          ))}

          {summary.length ? (
            <article className="lg:col-span-2">
              <h3 className="panel-label text-foreground">
                Backend run summary (/api/summary)
              </h3>
              <dl className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                {summary.map((f) => (
                  <div
                    key={f.label}
                    className="flex items-baseline justify-between gap-2 rounded-sm border border-border/70 bg-card px-2.5 py-1.5"
                  >
                    <dt className="readout text-[0.6875rem] text-muted-foreground">
                      {f.label}
                    </dt>
                    <dd className="readout text-xs text-foreground">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
