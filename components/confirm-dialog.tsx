'use client';

import { useEffect, useRef } from 'react';
import { useGSAP } from '@/hooks/use-gsap-timeline';
import { gsap } from '@/lib/gsap';

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

  useGSAP(() => {
    if (!isOpen) return;
    const overlay = overlayRef.current;
    const dialog = dialogRef.current;
    if (!overlay || !dialog) return;

    const mm = gsap.matchMedia();
    mm.add({ reduceMotion: '(prefers-reduced-motion: reduce)' }, (context) => {
      const { reduceMotion } = context.conditions as { reduceMotion: boolean };
      if (reduceMotion) {
        gsap.set(overlay, { opacity: 1 });
        gsap.set(dialog, { opacity: 1, scale: 1 });
        return;
      }
      gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: 'power1.out' });
      gsap.fromTo(
        dialog,
        { opacity: 0, scale: 0.94 },
        { opacity: 1, scale: 1, duration: 0.22, ease: 'back.out(1.7)' }
      );
    });

    return () => mm.revert();
  }, { dependencies: [isOpen], revertOnUpdate: true });

  if (!isOpen) return null;

  return (
    <div ref={overlayRef} className="confirm-overlay" onClick={onCancel}>
      <div ref={dialogRef} className="confirm-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3>{title}</h3>
        <p>{body}</p>
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
