'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Toast, ToastType } from '@/components/toast';
import { useGSAP } from '@/hooks/use-gsap-timeline';
import { gsap } from '@/lib/gsap';

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

  useGSAP(() => {
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

    if (cardsToReflow.length > 0) {
      gsap.from(cardsToReflow, { y: 8, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
    }

    prevIdsRef.current = currentIds;
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
