'use client';

import { useEffect } from 'react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

const ICON: Record<ToastType, string> = {
  success: '✓',
  info: 'ℹ',
  warning: '⚠',
  error: '✕',
};

const AUTO_DISMISS: ToastType[] = ['success', 'info'];

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onDismiss: (id: string) => void;
}

export function Toast({ id, message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!AUTO_DISMISS.includes(type)) return;
    const t = setTimeout(() => onDismiss(id), 3000);
    return () => clearTimeout(t);
  }, [id, type, onDismiss]);

  return (
    <div className={`toast toast--${type}`} role="alert" aria-live="assertive">
      <span aria-hidden="true">{ICON[type]}</span>
      <span className="toast-message">{message}</span>
      {!AUTO_DISMISS.includes(type) && (
        <button
          className="toast-dismiss"
          onClick={() => onDismiss(id)}
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
}
