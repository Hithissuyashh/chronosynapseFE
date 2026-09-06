import { createFileRoute, Link } from "@tanstack/react-router";

const TITLE = "Contact — Chronosynapse";
const DESCRIPTION =
  "Get in touch about Chronosynapse — quantum-clock telemetry, Kalman estimation and a BDH-inspired synaptic-memory abstraction.";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

const LINKS: { label: string; href: string; primary?: boolean }[] = [
  { label: "suyash.svish06@gmail.com", href: "mailto:suyash.svish06@gmail.com", primary: true },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/suyash-vishwakrma-445928356/" },
  { label: "GitHub", href: "https://github.com/Hithissuyashh" },
];

function ContactPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-[1100px] flex-col justify-center gap-10 px-6 py-20 lg:px-10">
      <Link
        to="/"
        className="readout text-[0.6875rem] uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to the lab
      </Link>

      <div className="max-w-[34rem] space-y-6">
        <h1 className="font-[var(--font-display,inherit)] text-5xl tracking-tight text-foreground sm:text-6xl">
          Let&rsquo;s talk<span className="text-primary">.</span>
        </h1>

        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Chronosynapse is designed and built by Suyash Vishwakarma. For collaboration, feedback,
          instrument access or anything numerical — email is the fastest way through.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target={l.href.startsWith("mailto:") ? undefined : "_blank"}
              rel="noreferrer"
              className={`readout rounded-md border px-4 py-2.5 text-xs transition-colors ${
                l.primary
                  ? "border-border/80 bg-card/40 text-foreground hover:border-foreground/40"
                  : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-5">
        <span className="text-xs text-muted-foreground">Suyash Vishwakarma</span>
        <span className="readout text-[0.6875rem] uppercase tracking-[0.2em] text-muted-foreground">
          Chronosynapse · optical clock digital twin
        </span>
      </div>

      <p className="readout text-[0.6875rem] text-muted-foreground">
        BDH-inspired educational abstraction — not the official BDH implementation.
      </p>
    </div>
  );
}
