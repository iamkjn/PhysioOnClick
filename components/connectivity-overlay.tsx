'use client';

import { useEffect, useState } from 'react';

export function ConnectivityOverlay() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="connectivity-overlay" role="alertdialog" aria-label="No internet connection">
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
        <circle cx="40" cy="40" r="40" fill="var(--color-primary-light)" />
        <path d="M24 34c4.4-4.4 10.4-7 16.5-7s12.1 2.6 16.5 7" stroke="var(--color-border)" strokeWidth="3" strokeLinecap="round" fill="none"/>
        <path d="M30 41c2.8-2.8 6.6-4.5 10.5-4.5" stroke="var(--color-border)" strokeWidth="3" strokeLinecap="round" fill="none"/>
        <circle cx="40" cy="52" r="3.5" fill="var(--color-border)" />
        <line x1="20" y1="20" x2="60" y2="60" stroke="var(--color-error)" strokeWidth="3" strokeLinecap="round"/>
      </svg>
      <h2>No internet connection</h2>
      <p>Check your WiFi or mobile data, then try again.</p>
      <button className="btn-retry" onClick={() => window.location.reload()}>
        Retry
      </button>
    </div>
  );
}
