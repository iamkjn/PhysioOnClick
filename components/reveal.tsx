"use client";

import { CSSProperties, useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/gsap";

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

// Safety net: if IntersectionObserver never fires (killed by an extension,
// stalls, whatever), content must not stay hidden forever.
const FORCE_VISIBLE_MS = 2000;

export function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = 600,
  className,
  style,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    // Already in view at mount (above the fold, or a short page) — never
    // hide it. Only elements below the fold get the pending state, so
    // there's no flash-of-invisible-content on first paint / hydration.
    const rect = el.getBoundingClientRect();
    const alreadyVisible = rect.top < window.innerHeight * 0.88 && rect.bottom > 0;
    if (alreadyVisible) return;

    // No IntersectionObserver (old browser, or a test/SSR-ish environment) —
    // stay visible rather than hide content with no way to reveal it.
    if (typeof IntersectionObserver === "undefined") return;

    el.classList.add("reveal--pending");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("reveal--visible");
          el.classList.remove("reveal--pending");
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -12% 0px" }
    );
    observer.observe(el);

    const forceTimer = window.setTimeout(() => {
      el.classList.add("reveal--visible");
      el.classList.remove("reveal--pending");
      observer.unobserve(el);
    }, FORCE_VISIBLE_MS);

    return () => {
      observer.disconnect();
      window.clearTimeout(forceTimer);
    };
  }, []);

  const offset = OFFSETS[direction];

  return (
    <div
      ref={ref}
      className={["reveal", className].filter(Boolean).join(" ")}
      style={{
        ...style,
        "--reveal-x": `${offset.x}px`,
        "--reveal-y": `${offset.y}px`,
        "--reveal-delay": `${delay}ms`,
        "--reveal-duration": `${duration}ms`,
      } as CSSProperties}
    >
      {children}
    </div>
  );
}
