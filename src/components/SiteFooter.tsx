import { Link } from "@tanstack/react-router";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { label: "Overview", href: "/" as const },
      { label: "Console", href: "/console" as const },
      { label: "Pipeline", href: "/pipeline" as const },
    ],
  },
  {
    title: "Method",
    links: [
      { label: "Kalman estimation", href: "/console" as const },
      { label: "Synaptic memory", href: "/console" as const },
      { label: "Phase schedule", href: "/console" as const },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "Data sources", href: "/pipeline" as const },
      { label: "Experiment control", href: "/console" as const },
      { label: "Contact", href: "/contact" as const },
    ],
  },
];

/** Minimal wide footer with a large wordmark watermark. */
export function SiteFooter() {
  return (
    <footer className="relative mt-20 overflow-hidden rounded-t-[28px] border-t border-white/[0.06] bg-panel/70 px-5 pt-14 backdrop-blur-xl lg:px-12">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Chronosynapse"
                width={32}
                height={32}
                className="h-8 w-8 rounded-full border border-white/10 bg-white/5 object-cover"
              />
              <span className="readout text-[0.8125rem] uppercase tracking-[0.22em] text-foreground">
                Chronosynapse
              </span>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Quantum-clock telemetry, scalar Kalman estimation, and a
              BDH-inspired educational abstraction of synaptic fast-weight
              memory. All plotted values come from the experiment backend.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="panel-label">{col.title}</h2>
              <ul className="mt-5 space-y-3.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="hairline mt-12 flex flex-wrap items-center justify-between gap-3 pt-6">
          <span className="readout text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground">
            © 2026 Chronosynapse · DataForge Pathway track
          </span>
          <span className="readout text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground">
            BDH-inspired educational abstraction — not the official BDH
            implementation
          </span>
        </div>

        <div
          aria-hidden
          className="display-type select-none overflow-hidden whitespace-nowrap pt-8 text-[clamp(2rem,9vw,8rem)] leading-[0.85] tracking-[-0.03em] text-white/[0.035]"
        >
          CHRONOSYNAPSE
        </div>
      </div>
    </footer>
  );
}
