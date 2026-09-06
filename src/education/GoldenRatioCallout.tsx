import { INVERSE_PHI } from "@/types/science";
import { formatNumber } from "@/components/Readout";

export function GoldenRatioCallout({ gain }: { gain: number | null }) {
  return (
    <section
      className="panel-surface px-4 py-4"
      aria-label="Educational callout — steady-state Kalman gain"
    >
      <h2 className="text-base font-medium text-foreground">
        Watch a Kalman filter discover the golden ratio.
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        Under fixed process and measurement-noise assumptions, the scalar Kalman
        filter converges to a steady-state gain. In the Q = R configuration used
        here, that gain is 1/φ.
      </p>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <span className="readout text-xs text-muted-foreground">
          1/φ = 2/(1+√5) ={" "}
          <span className="text-truth">{formatNumber(INVERSE_PHI, 6)}</span>
        </span>
        <span className="readout text-xs text-muted-foreground">
          backend gain K at this tick ={" "}
          <span className="text-foreground">
            {gain === null ? "—" : formatNumber(gain, 6)}
          </span>
        </span>
        <span className="readout text-xs text-muted-foreground">
          |K − 1/φ| ={" "}
          <span className="text-foreground">
            {gain === null ? "—" : formatNumber(Math.abs(gain - INVERSE_PHI), 6)}
          </span>
        </span>
      </div>
      <p className="mt-3 max-w-3xl border-l border-border pl-3 text-xs text-muted-foreground">
        The 1/φ value is an analytic reference for the Q = R case, printed for
        comparison. K itself is read from the backend — the comparison is shown,
        never forced.
      </p>

      <h3 className="mt-5 text-sm font-medium text-foreground">
        What happens when the world changes?
      </h3>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        The controlled semantic stimulus switches from THERMAL + NEGATIVE
        (phase A) to THERMAL + POSITIVE (phase B) and back to THERMAL + NEGATIVE
        (phase C). Through those switches the BDH-inspired association strengths
        adapt: σ(THERMAL, NEGATIVE) is reinforced while it is stimulated and
        decays once the competing stimulus takes over, and σ(THERMAL, POSITIVE)
        does the reverse — retention, interference, then relearning, visible on
        one shared timeline.
      </p>
      <p className="mt-2 max-w-3xl text-xs text-muted-foreground">
        The Kalman branch and the BDH-inspired abstraction are two different
        mechanisms displayed side by side. They are not claimed to be
        mathematically equivalent: Kalman maintains an explicit estimate with an
        uncertainty covariance, while the BDH-inspired educational abstraction
        represents associations as dynamically changing synaptic state.
      </p>
    </section>
  );
}
