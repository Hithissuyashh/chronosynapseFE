import { useEffect, useRef } from "react";

/**
 * AsciiField — sparse falling character columns rendered on a 2D canvas.
 * Purely decorative: it encodes no experimental values.
 */
export default function AsciiField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const GLYPHS = "01:.-=+*#%@ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const CELL = 12;
    let cols = 0;
    let rows = 0;
    let heads: number[] = [];
    let speeds: number[] = [];
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.parentElement?.offsetWidth ?? window.innerWidth;
      const h = canvas.parentElement?.offsetHeight ?? window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      cols = Math.ceil(w / CELL);
      rows = Math.ceil(h / CELL);
      heads = Array.from({ length: cols }, () => Math.random() * rows);
      speeds = Array.from({ length: cols }, () => 0.12 + Math.random() * 0.5);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${CELL - 2}px "IBM Plex Mono", ui-monospace, monospace`;
      ctx.textBaseline = "top";
    };
    resize();
    window.addEventListener("resize", resize);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = 0;

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (t - last < 60) return;
      last = t;

      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);

      for (let c = 0; c < cols; c++) {
        const head = heads[c] ?? 0;
        const tail = 14 + ((c * 7) % 22);
        for (let i = 0; i < tail; i++) {
          const row = Math.floor(head) - i;
          if (row < 0 || row > rows) continue;
          const fade = 1 - i / tail;
          const y = row * CELL;
          const dim = 0.06 + fade * 0.26 * (0.4 + 0.6 * ((c * 13 + row * 7) % 10) / 10);
          ctx.fillStyle = `rgba(228, 224, 216, ${dim.toFixed(3)})`;
          const g = GLYPHS[(c * 31 + row * 17 + Math.floor(head)) % GLYPHS.length]!;
          ctx.fillText(g, c * CELL, y);
        }
        if (!reduced) heads[c] = head + (speeds[c] ?? 0.2);
        if ((heads[c] ?? 0) - 40 > rows) heads[c] = -Math.random() * rows * 0.5;
      }
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={className ?? "h-full w-full"} aria-hidden />;
}
