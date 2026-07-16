'use client';

import { useEffect, useRef } from 'react';
import { useGSAP } from '@/hooks/use-gsap-timeline';
import { gsap, prefersReducedMotion } from '@/lib/gsap';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  confirmVariant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  body,
  confirmLabel,
  confirmVariant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLButtonElement>('.btn-cancel')?.focus();
    return () => {
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const cancelBtn = dialog.querySelector<HTMLButtonElement>('.btn-cancel');
      const confirmBtn = dialog.querySelector<HTMLButtonElement>('.btn-confirm');
      if (!cancelBtn || !confirmBtn) return;

      if (e.shiftKey) {
        if (document.activeElement === cancelBtn) {
          e.preventDefault();
          confirmBtn.focus();
        }
      } else {
        if (document.activeElement === confirmBtn) {
          e.preventDefault();
          cancelBtn.focus();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  useGSAP(() => {
    if (!isOpen) return;
    const overlay = overlayRef.current;
    const dialog = dialogRef.current;
    if (!overlay || !dialog) return;

    if (prefersReducedMotion()) {
      gsap.set(overlay, { opacity: 1 });
      gsap.set(dialog, { opacity: 1, scale: 1 });
      return;
    }
    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: 'power1.out' });
    gsap.fromTo(
      dialog,
      { opacity: 0, scale: 0.94 },
      // was 'back.out(1.7)' — same bounce-curve violation as toast.tsx's
      // entrance; swapped for the same approved ease-out-expo.
      { opacity: 1, scale: 1, duration: 0.22, ease: 'expo.out' }
    );
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div ref={overlayRef} className="confirm-overlay" onClick={onCancel}>
      <div
        ref={dialogRef}
        className="confirm-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-body"
      >
        <h3 id="confirm-dialog-title">{title}</h3>
        <p id="confirm-dialog-body">{body}</p>
        <div className="confirm-dialog-actions">
          <button className="btn-cancel" onClick={onCancel}>
            Keep
          </button>
          <button
            className={`btn-confirm${confirmVariant === 'destructive' ? ' btn-confirm--destructive' : ''}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
