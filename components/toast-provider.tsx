'use client';

import dynamic from 'next/dynamic';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ToastType } from '@/components/toast';

// components/toast.tsx pulls in GSAP (useGSAP + gsap) for its entrance
// animation. Loading it via next/dynamic keeps that out of every route's
// initial bundle — the chunk only fetches once a toast actually renders,
// not merely when ToastProvider (root layout) mounts.
const Toast = dynamic(() => import('@/components/toast').then((mod) => mod.Toast), { ssr: false });

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  show: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const prevIdsRef = useRef<string[]>([]);

  const show = useCallback((message: string, type: ToastType) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => {
      const next = [...prev, { id, message, type }];
      return next.slice(-3); // keep max 3 visible
    });
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Reflow already-visible cards when the array shifts (e.g. one dismissed).
  // GSAP is loaded lazily here too, and skipped entirely when there's
  // nothing to reflow, so a page that never shows more than one toast at a
  // time never pays for it.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const cards = Array.from(viewport.children) as HTMLElement[];
    const currentIds = toasts.map((t) => t.id);

    if (cards.length === 0) {
      prevIdsRef.current = [];
      return;
    }

    // Only reflow cards whose id already existed before this render — a card
    // whose id is new just mounted and its own entrance animation (in Toast)
    // handles it, so reflowing it here would interrupt that animation. This
    // works correctly even when the array length is unchanged, e.g. when a
    // toast is added while already at the 3-toast cap and `show()` drops the
    // oldest id to keep the array at length 3.
    const prevIds = prevIdsRef.current;
    const cardsToReflow = cards.filter((_, i) => prevIds.includes(currentIds[i]));
    prevIdsRef.current = currentIds;

    if (cardsToReflow.length === 0) return;

    let cancelled = false;
    import('@/lib/gsap').then(({ gsap }) => {
      if (!cancelled) gsap.from(cardsToReflow, { y: 8, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
    });
    return () => {
      cancelled = true;
    };
  }, [toasts]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div ref={viewportRef} className="toast-viewport" aria-label="Notifications">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
