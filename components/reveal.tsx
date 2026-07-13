"use client";

import { CSSProperties, useRef } from "react";
import { useGSAP } from "@/hooks/use-gsap-timeline";
import { gsap, ScrollTrigger } from "@/lib/gsap";

type Direction = "up" | "down" | "left" | "right" | "fade";

interface RevealProps {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
}

const OFFSETS: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 28 },
  down: { x: 0, y: -28 },
  left: { x: -28, y: 0 },
  right: { x: 28, y: 0 },
  fade: { x: 0, y: 0 },
};

export function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = 600,
  className,
  style,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = ref.current;
    if (!el) return;

    const mm = gsap.matchMedia();
    mm.add(
      {
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { reduceMotion } = context.conditions as { reduceMotion: boolean };
        if (reduceMotion) {
          gsap.set(el, { opacity: 1, x: 0, y: 0, scale: 1 });
          return;
        }

        const offset = OFFSETS[direction];
        gsap.set(el, { opacity: 0, x: offset.x, y: offset.y, scale: 0.98 });

        const trigger = ScrollTrigger.create({
          trigger: el,
          start: "top 85%",
          once: true,
          onEnter: () => {
            gsap.to(el, {
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
              duration: duration / 1000,
              delay: delay / 1000,
              ease: "power3.out",
            });
          },
        });

        return () => trigger.kill();
      }
    );

    return () => mm.revert();
  }, [direction, delay, duration]);

  return (
    <div ref={ref} className={["reveal", className].filter(Boolean).join(" ")} style={style}>
      {children}
    </div>
  );
}
