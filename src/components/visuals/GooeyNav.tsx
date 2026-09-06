import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";

/**
 * GooeyNav — pill navigation with a gooey particle burst on activation.
 * Presentation only.
 */

export type GooeyNavItem = { label: string; href: string };

type ParticleTuple = [number, number, number, number];

const noise = (n = 1) => n / 2 - Math.random() * n;

const getXY = (distance: number, pointIndex: number, totalPoints: number): [number, number] => {
  const angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
  return [distance * Math.cos(angle), distance * Math.sin(angle)];
};

const createParticle = (
  i: number,
  t: number,
  d: [number, number],
  r: number,
): { start: [number, number]; end: [number, number]; time: number; scale: number; color: number; rotate: number } => {
  const rAngle = noise(r / 10);
  return {
    start: getXY(d[0], 15 - i, 15),
    end: getXY(d[1] + noise(7), 15 - i, 15),
    time: t,
    scale: 1 + noise(0.2),
    color: Math.floor(Math.random() * 4) + 1,
    rotate: rAngle > 0 ? (rAngle + r / 20) * 10 : (rAngle - r / 20) * 10,
  };
};

export default function GooeyNav({
  items,
  particleCount = 15,
  particleDistances = [90, 10],
  particleR = 100,
  animationTime = 600,
  timeVariance = 300,
  colors = [1, 2, 3, 1, 2, 3, 1, 4],
}: {
  items: GooeyNavItem[];
  particleCount?: number;
  particleDistances?: [number, number];
  particleR?: number;
  animationTime?: number;
  timeVariance?: number;
  colors?: number[];
}) {
  const navRef = useRef<HTMLUListElement | null>(null);
  const filterRef = useRef<HTMLSpanElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const location = useLocation();
  const [ready, setReady] = useState(false);

  const activeIndex = Math.max(
    0,
    items.findIndex((item) =>
      item.href === "/" ? location.pathname === "/" : location.pathname.startsWith(item.href),
    ),
  );

  const makeParticles = (element: HTMLElement) => {
    const d = particleDistances;
    const bubbleTime = animationTime * 2 + timeVariance;
    element.style.setProperty("--time", `${bubbleTime}ms`);
    for (let i = 0; i < particleCount; i++) {
      const t = animationTime * 2 + noise(timeVariance * 2);
      const p = createParticle(i, t, d as [number, number], particleR);
      setTimeout(() => {
        const particle = document.createElement("span");
        const point = document.createElement("span");
        particle.classList.add("gooey-particle");
        const tuple: ParticleTuple = [p.start[0], p.start[1], p.end[0], p.end[1]];
        particle.style.setProperty("--start-x", `${tuple[0]}px`);
        particle.style.setProperty("--start-y", `${tuple[1]}px`);
        particle.style.setProperty("--end-x", `${tuple[2]}px`);
        particle.style.setProperty("--end-y", `${tuple[3]}px`);
        particle.style.setProperty("--time", `${p.time}ms`);
        particle.style.setProperty("--scale", `${p.scale}`);
        particle.style.setProperty("--color", `var(--gooey-color-${colors[p.color] ?? 1}, var(--primary))`);
        particle.style.setProperty("--rotate", `${p.rotate}deg`);
        point.classList.add("gooey-point");
        particle.appendChild(point);
        element.appendChild(particle);
        requestAnimationFrame(() => element.classList.add("gooey-active"));
        setTimeout(() => {
          try {
            element.removeChild(particle);
          } catch {
            /* already removed */
          }
        }, t);
      }, 30);
    }
  };

  const positionTo = (index: number, animate: boolean) => {
    const nav = navRef.current;
    const filter = filterRef.current;
    const text = textRef.current;
    if (!nav || !filter || !text) return;
    const li = nav.querySelectorAll("li")[index] as HTMLElement | undefined;
    if (!li) return;
    const pos = { left: `${li.offsetLeft}px`, top: `${li.offsetTop}px`, width: `${li.offsetWidth}px`, height: `${li.offsetHeight}px` };
    Object.assign(filter.style, pos);
    Object.assign(text.style, pos);
    text.innerText = li.innerText;
    if (animate) {
      filter.querySelectorAll(".gooey-particle").forEach((p) => filter.removeChild(p));
      filter.classList.remove("gooey-active");
      text.classList.remove("gooey-text-active");
      void text.offsetWidth;
      text.classList.add("gooey-text-active");
      makeParticles(filter);
    }
  };

  useEffect(() => {
    positionTo(activeIndex, ready);
    if (!ready) setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  useEffect(() => {
    const onResize = () => positionTo(activeIndex, false);
    window.addEventListener("resize", onResize);
    const id = window.setTimeout(onResize, 300);
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  return (
    <div className="gooey-nav relative">
      <span className="gooey-effect gooey-filter" ref={filterRef} aria-hidden />
      <span className="gooey-effect gooey-text" ref={textRef} aria-hidden />
      <ul ref={navRef} className="relative z-10 flex list-none items-center gap-1">
        {items.map((item, i) => (
          <li
            key={item.href}
            className={`rounded-full transition-colors ${i === activeIndex ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Link
              to={item.href}
              activeOptions={{ exact: item.href === "/" }}
              className="block px-4 py-1.5 text-[0.8125rem] font-medium tracking-tight outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
