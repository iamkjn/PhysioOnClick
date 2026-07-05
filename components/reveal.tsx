"use client";

import { CSSProperties } from "react";
import { useInView } from "@/hooks/use-in-view";

type Direction = "up" | "down" | "left" | "right" | "fade";

interface RevealProps {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
}

export function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = 600,
  className,
  style,
}: RevealProps) {
  const [ref, inView] = useInView();

  return (
    <div
      ref={ref}
      className={[
        "reveal",
        `reveal-${direction}`,
        inView ? "in-view" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
