'use client';

import { useEffect, useRef } from 'react';
import { useGSAP } from '@/hooks/use-gsap-timeline';
import { gsap } from '@/lib/gsap';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

const AUTO_DISMISS: ToastType[] = ['success', 'info'];
const AUTO_DISMISS_MS = 3000;

function ToastIcon({ type }: { type: ToastType }) {
  const stroke = 'currentColor';
  switch (type) {
    case 'success':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.7" />
          <path d="M8 12.5l2.5 2.5L16 9.5" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'warning':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 4l9.5 16H2.5L12 4z" stroke={stroke} strokeWidth="1.7" strokeLinejoin="round" />
          <line x1="12" y1="10" x2="12" y2="14.5" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="12" cy="17.3" r="0.9" fill={stroke} />
        </svg>
      );
    case 'error':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.7" />
          <line x1="9" y1="9" x2="15" y2="15" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
          <line x1="15" y1="9" x2="9" y2="15" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'info':
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.7" />
          <line x1="12" y1="11" x2="12" y2="16.5" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="12" cy="7.7" r="0.9" fill={stroke} />
        </svg>
      );
  }
}

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onDismiss: (id: string) => void;
}

export function Toast({ id, message, type, onDismiss }: ToastProps) {
  const isAutoDismiss = AUTO_DISMISS.includes(type);
  const cardRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAutoDismiss) return;
    const t = setTimeout(() => onDismiss(id), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [id, isAutoDismiss, onDismiss]);

  useGSAP(() => {
    const el = cardRef.current;
    if (!el) return;

    const mm = gsap.matchMedia();
    mm.add({ reduceMotion: '(prefers-reduced-motion: reduce)' }, (context) => {
      const { reduceMotion } = context.conditions as { reduceMotion: boolean };
      if (reduceMotion) {
        gsap.set(el, { opacity: 1, y: 0, scale: 1 });
        return;
      }

      gsap.fromTo(
        el,
        { opacity: 0, y: 16, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.32, ease: 'back.out(1.6)' }
      );

      if (type === 'warning' || type === 'error') {
        gsap.fromTo(
          el,
          { x: 0 },
          { x: 4, duration: 0.06, repeat: 5, yoyo: true, delay: 0.32, ease: 'power1.inOut' }
        );
      }

      if (progressRef.current) {
        gsap.fromTo(
          progressRef.current,
          { scaleX: 1 },
          { scaleX: 0, duration: AUTO_DISMISS_MS / 1000, ease: 'none', transformOrigin: 'left center' }
        );
      }
    });

    return () => mm.revert();
  }, [type]);

  return (
    <div ref={cardRef} className={`toast toast--${type}`} role="alert" aria-live="assertive">
      <span className={`toast-icon-badge toast-icon-badge--${type}`}>
        <ToastIcon type={type} />
      </span>
      <span className="toast-message">{message}</span>
      {!isAutoDismiss && (
        <button className="toast-dismiss" onClick={() => onDismiss(id)} aria-label="Dismiss">
          ✕
        </button>
      )}
      {isAutoDismiss && <div ref={progressRef} className="toast-progress" />}
    </div>
  );
}
