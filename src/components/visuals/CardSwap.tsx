import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

/**
 * CardSwap — a stacked deck of glass cards that continuously swaps the front
 * card to the back. Presentation only.
 */

export type CardProps = {
  customClass?: string;
  className?: string;
  children?: ReactNode;
  style?: React.CSSProperties;
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ customClass, className, children, style }, ref) => (
    <div
      ref={ref}
      style={style}
      className={cn(
        "glass-deck-card absolute left-1/2 top-1/2 [transform-style:preserve-3d]",
        customClass,
        className,
      )}
    >
      {children}
    </div>
  ),
);
Card.displayName = "Card";

type Slot = { x: number; y: number; z: number; zIndex: number };

const makeSlot = (i: number, distX: number, distY: number, total: number): Slot => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i,
});

const place = (el: HTMLElement, slot: Slot, skew: number) => {
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: "center center",
    zIndex: slot.zIndex,
    force3D: true,
  });
};

export default function CardSwap({
  width = "100%",
  height = "100%",
  cardDistance = 60,
  verticalDistance = 70,
  delay = 5000,
  pauseOnHover = false,
  skewAmount = 5,
  onCardClick,
  children,
  className,
}: {
  width?: number | string;
  height?: number | string;
  cardDistance?: number;
  verticalDistance?: number;
  delay?: number;
  pauseOnHover?: boolean;
  skewAmount?: number;
  onCardClick?: (index: number) => void;
  children: ReactNode;
  className?: string;
}) {
  const childArr = useMemo(
    () => Children.toArray(children).filter(isValidElement) as ReactElement<CardProps>[],
    [children],
  );
  const refs = useMemo(
    () => childArr.map(() => ({ current: null as HTMLDivElement | null })),
    [childArr.length], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const order = useRef<number[]>(childArr.map((_, i) => i));
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const total = refs.length;
    if (total === 0) return;
    refs.forEach((r, i) => {
      if (r.current) place(r.current, makeSlot(i, cardDistance, verticalDistance, total), skewAmount);
    });

    const swap = () => {
      if (order.current.length < 2) return;
      const [front, ...rest] = order.current as [number, ...number[]];
      const elFront = refs[front]?.current;
      if (!elFront) return;
      const tl = gsap.timeline();
      timeline.current = tl;

      tl.to(elFront, { y: "+=500", duration: 0.6, ease: "power2.inOut" });
      tl.addLabel("promote", "-=0.3");
      rest.forEach((idx, i) => {
        const el = refs[idx]?.current;
        if (!el) return;
        const slot = makeSlot(i, cardDistance, verticalDistance, total);
        tl.set(el, { zIndex: slot.zIndex }, "promote");
        tl.to(
          el,
          { x: slot.x, y: slot.y, z: slot.z, duration: 0.6, ease: "power2.inOut" },
          `promote+=${i * 0.1}`,
        );
      });

      const backSlot = makeSlot(total - 1, cardDistance, verticalDistance, total);
      tl.addLabel("return", "promote+=0.4");
      tl.set(elFront, { zIndex: backSlot.zIndex }, "return");
      tl.to(elFront, { x: backSlot.x, z: backSlot.z, duration: 0.6, ease: "power2.inOut" }, "return");
      tl.to(elFront, { y: backSlot.y, duration: 0.6, ease: "power2.inOut" }, "return");
      tl.call(() => {
        order.current = [...rest, front];
      });
    };

    swapRef.current = swap;
    interval.current = setInterval(swap, delay);

    return () => {
      if (interval.current) clearInterval(interval.current);
      timeline.current?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardDistance, verticalDistance, delay, skewAmount, refs.length]);

  const swapRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!pauseOnHover) return;
    if (paused) {
      if (interval.current) clearInterval(interval.current);
      timeline.current?.pause();
    } else {
      timeline.current?.play();
      interval.current = setInterval(() => swapRef.current?.(), delay);
    }
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, [paused, pauseOnHover, delay]);

  return (
    <div
      className={cn(
        "relative origin-center [perspective:900px] [transform-style:preserve-3d]",
        className,
      )}
      style={{ width, height }}
      onMouseEnter={() => pauseOnHover && setPaused(true)}
      onMouseLeave={() => pauseOnHover && setPaused(false)}
    >
      {childArr.map((child, i) =>
        cloneElement(child, {
          key: i,
          ref: (node: HTMLDivElement | null) => {
            const slot = refs[i];
            if (slot) slot.current = node;
          },
          onClick: () => onCardClick?.(i),
        } as never),
      )}
    </div>
  );
}
