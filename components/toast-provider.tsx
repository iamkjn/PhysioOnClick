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
  const prevCountRef = useRef(0);

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
    const cards = Array.from(viewport.children);
    if (cards.length === 0) {
      prevCountRef.current = 0;
      return;
    }

    const isGrowing = toasts.length > prevCountRef.current;
    // When a toast is added, skip the last card (it's new — Toast's own entrance
    // animation handles it) and only reflow the ones that shifted position.
    // When a toast is removed, reflow every remaining card to settle.
    const cardsToReflow = isGrowing ? cards.slice(0, -1) : cards;

    if (cardsToReflow.length > 0) {
      gsap.from(cardsToReflow, { y: 8, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
    }

    prevCountRef.current = toasts.length;
  }, [toasts.length]);

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
