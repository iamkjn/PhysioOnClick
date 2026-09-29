"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { trackGrowthEvent, type GrowthEventName, type GrowthEventParams } from "@/lib/growth-tracking";

type TrackedContentLinkProps = Omit<ComponentProps<typeof Link>, "onClick"> & {
  event: GrowthEventName;
  params?: GrowthEventParams;
  children: ReactNode;
};

export function TrackedContentLink({
  event,
  params,
  children,
  ...props
}: TrackedContentLinkProps) {
  return (
    <Link
      {...props}
      onClick={() => {
        trackGrowthEvent(event, params);
      }}
    >
      {children}
    </Link>
  );
}
