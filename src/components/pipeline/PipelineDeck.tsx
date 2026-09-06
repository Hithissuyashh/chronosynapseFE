import { Suspense, forwardRef, lazy } from "react";
import { ClientOnly } from "@tanstack/react-router";

const CardSwap = lazy(() => import("@/components/visuals/CardSwap"));

interface DeckCard {
  n: string;
  title: string;
  computes: string;
  input: string;
  output: string;
  console: string;
  tag: string;
}

const DECK: DeckCard[] = [
  {
    n: "01",
    title: "TELEMETRY",
    computes:
      "Maps ambient temperature and magnetic field onto a clock detuning, then reports a noisy measurement of it, once per tick.",
    input: "temperature T, magnetic field B",
    output: "true detuning Δ, measured offset z, tick index t",
    console: "Feeds the tick counter and the detuning chart (true vs measured).",
    tag: "Live data",
  },
  {
    n: "02",
    title: "EVENT ENCODING",
    computes:
      "Labels each tick with the semantic concepts active in it — THERMAL, NEGATIVE, POSITIVE, MAGNETIC — following the A → B → A protocol, keeping physical events separate from controlled stimuli.",
    input: "telemetry records",
    output: "phase label + semantic event set per tick",
    console: "Drives the phase badge, the A/B/A timeline, and the event cards.",
    tag: "Computed data",
  },
  {
    n: "03",
    title: "KALMAN BRANCH",
    computes:
      "Predicts the next state, then corrects it with the innovation y = z − x̂ weighted by the gain K = P⁻/(P⁻+R). Uncertainty P is propagated explicitly and shrinks as evidence accumulates.",
    input: "measured offset z per tick",
    output: "x̂, P, y, S, K, estimation error",
    console: "Populates the Kalman tiles and the uncertainty/diagnostics chart.",
    tag: "Computed data",
  },
  {
    n: "04",
    title: "SYNAPTIC BRANCH",
    computes:
      "Holds an association strength σ per concept pair. Co-activated pairs are written with learning rate η; every other pair is weakened by decay u, so σ tracks the regime currently being presented.",
    input: "semantic events, η, decay u",
    output: "σ(T,NEG), σ(T,POS), σ(T,MAG), memory difference",
    console: "Drives the σ chart, the synapse graph edges, and the σ tiles.",
    tag: "Educational abstraction",
  },
  {
    n: "05",
    title: "PATHWAY → FASTAPI",
    computes:
      "Joins both branch states on the shared tick key and materialises them as streams, served as JSON without further transformation.",
    input: "Kalman state + association state per tick",
    output: "/api/kalman, /api/memory, /api/comparison, /api/experiment/latest",
    console: "Every value the console renders arrives through these endpoints.",
    tag: "Live data",
  },
];

/** Rotating glass deck introducing the pipeline stages. Presentation only. */
export function PipelineDeck() {
  return (
    <div className="hero-shell grid items-center gap-8 overflow-hidden p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:p-9">
      <div className="min-w-0">
        <p className="panel-label">Stages</p>
        <h2 className="display-type mt-3 text-3xl tracking-tight text-foreground sm:text-4xl">
          From a physical clock to a rendered readout
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          One tick-ordered stream feeds two independent mechanisms for holding state.
          Each card states what the stage computes, what enters and leaves it, and
          which part of the console it ends up driving.
        </p>
        <p className="readout mt-5 text-[0.6875rem] text-muted-foreground">
          Card motion is presentation only — it carries no numerical results.
        </p>
      </div>

      <div className="relative h-[24rem] -translate-x-6 sm:h-[28rem] lg:-translate-x-16">
        <ClientOnly fallback={null}>
          <Suspense fallback={null}>
            <CardSwap cardDistance={42} verticalDistance={54} delay={5000} pauseOnHover={false}>
              {DECK.map((c) => (
                <CardBody key={c.n} {...c} />
              ))}
            </CardSwap>
          </Suspense>
        </ClientOnly>
      </div>
    </div>
  );
}


const CardBody = forwardRef<HTMLDivElement, DeckCard>(function CardBody(
  { n, title, computes, input, output, console: consoleUse, tag },
  ref,
) {
  return (
    <div
      ref={ref}
      className="glass-deck-card absolute left-1/2 top-1/2 flex flex-col [transform-style:preserve-3d]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="readout text-[0.6875rem] tracking-[0.2em] text-warm">{n}</span>
        <span className="readout rounded-full border border-white/10 px-2.5 py-1 text-[0.625rem] uppercase tracking-wider text-muted-foreground">
          {tag}
        </span>
      </div>
      <h3 className="readout mt-4 text-lg tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 break-words text-[0.8125rem] leading-relaxed text-muted-foreground">
        {computes}
      </p>
      <dl className="mt-4 grid gap-1.5 text-[0.6875rem]">
        <div className="flex min-w-0 gap-2">
          <dt className="readout w-16 shrink-0 uppercase tracking-[0.14em] text-muted-foreground">
            In
          </dt>
          <dd className="readout min-w-0 break-words text-foreground">{input}</dd>
        </div>
        <div className="flex min-w-0 gap-2">
          <dt className="readout w-16 shrink-0 uppercase tracking-[0.14em] text-muted-foreground">
            Out
          </dt>
          <dd className="readout min-w-0 break-words text-foreground">{output}</dd>
        </div>
        <div className="flex min-w-0 gap-2">
          <dt className="readout w-16 shrink-0 uppercase tracking-[0.14em] text-muted-foreground">
            Console
          </dt>
          <dd className="min-w-0 break-words text-muted-foreground">{consoleUse}</dd>
        </div>
      </dl>
    </div>
  );
});
