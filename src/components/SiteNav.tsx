import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";

const LINKS = [
  { label: "Overview", href: "/" },
  { label: "Console", href: "/console" },
  { label: "Pipeline", href: "/pipeline" },
  { label: "Contact", href: "/contact" },
];

/** Floating pill navigation — minimal, matte, no status chrome. */
export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 lg:px-6 lg:pt-5">
      <div className="mx-auto max-w-[1240px]">
        <div className="glass-panel flex items-center gap-4 rounded-full px-4 py-2.5 lg:px-6">
          <Link
            to="/"
            className="group flex min-w-0 items-center gap-3 outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <img
              src="/logo.png"
              alt="Chronosynapse"
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded-full border border-white/10 bg-white/5 object-cover shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
            />
            <span className="readout min-w-0 truncate text-[0.8125rem] uppercase tracking-[0.22em] text-foreground">
              Chronosynapse
            </span>
          </Link>

          <nav
            aria-label="Primary"
            className="ml-auto hidden items-center gap-7 md:flex"
          >
            {LINKS.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                activeOptions={{ exact: l.href === "/" }}
                className="readout text-[0.6875rem] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <Link
            to="/console"
            className="pill-btn readout ml-auto hidden text-[0.6875rem] uppercase tracking-[0.18em] md:ml-6 md:inline-flex"
          >
            Launch console
          </Link>

          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "Close navigation" : "Open navigation"}
            onClick={() => setOpen((v) => !v)}
            className="pill-btn ml-auto grid h-9 w-9 shrink-0 place-items-center !px-0 text-muted-foreground md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {open ? (
          <nav
            aria-label="Primary mobile"
            className="glass-panel mt-2 grid gap-1 p-2 md:hidden"
          >
            {LINKS.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                activeOptions={{ exact: l.href === "/" }}
                onClick={() => setOpen(false)}
                className="readout rounded-lg px-3 py-2.5 text-[0.75rem] uppercase tracking-[0.16em] text-muted-foreground hover:bg-white/5 hover:text-foreground"
                activeProps={{ className: "text-foreground bg-white/5" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
