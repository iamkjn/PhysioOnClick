import Link from 'next/link';

type IllustrationType = 'calendar' | 'chart' | 'people' | 'article' | 'chat' | 'search' | 'wifi-off';

interface EmptyStateProps {
  illustration: IllustrationType;
  title: string;
  body: string;
  cta?: {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: 'teal' | 'gold';
  };
}

const ILLUSTRATIONS: Record<IllustrationType, React.ReactNode> = {
  calendar: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="40" fill="var(--color-primary-light)" />
      <rect x="22" y="26" width="36" height="32" rx="4" stroke="var(--color-primary)" strokeWidth="2.5" fill="var(--color-surface)" />
      <line x1="22" y1="34" x2="58" y2="34" stroke="var(--color-primary)" strokeWidth="2" />
      <line x1="31" y1="22" x2="31" y2="30" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="49" y1="22" x2="49" y2="30" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="30" y="41" width="8" height="8" rx="2" fill="var(--color-primary-light)" stroke="var(--color-primary)" strokeWidth="1.5" />
    </svg>
  ),
  chart: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="40" fill="var(--color-primary-light)" />
      <polyline points="22,54 34,40 44,46 58,28" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="22" cy="54" r="3" fill="var(--color-primary)" />
      <circle cx="34" cy="40" r="3" fill="var(--color-primary)" />
      <circle cx="44" cy="46" r="3" fill="var(--color-primary)" />
      <circle cx="58" cy="28" r="3" fill="var(--color-gold)" />
    </svg>
  ),
  people: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="40" fill="var(--color-primary-light)" />
      <circle cx="32" cy="32" r="8" stroke="var(--color-primary)" strokeWidth="2.5" fill="var(--color-surface)" />
      <path d="M18 54c0-7.7 6.3-14 14-14" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="50" cy="32" r="6" stroke="var(--color-primary)" strokeWidth="2" fill="var(--color-primary-light)" />
      <path d="M56 54c0-5.5-4.5-10-10-10" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="62" cy="46" r="8" fill="var(--color-primary)" />
      <line x1="62" y1="42" x2="62" y2="50" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="58" y1="46" x2="66" y2="46" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  article: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="40" fill="var(--color-primary-light)" />
      <rect x="24" y="22" width="32" height="36" rx="4" stroke="var(--color-primary)" strokeWidth="2.5" fill="var(--color-surface)" />
      <line x1="30" y1="32" x2="50" y2="32" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
      <line x1="30" y1="39" x2="50" y2="39" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" />
      <line x1="30" y1="46" x2="42" y2="46" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  chat: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="40" fill="var(--color-primary-light)" />
      <rect x="20" y="24" width="36" height="26" rx="8" stroke="var(--color-primary)" strokeWidth="2.5" fill="var(--color-surface)" />
      <path d="M28 50l-6 6v-6" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
      <circle cx="33" cy="37" r="2.5" fill="var(--color-primary)" />
      <circle cx="40" cy="37" r="2.5" fill="var(--color-primary)" />
      <circle cx="47" cy="37" r="2.5" fill="var(--color-primary)" />
    </svg>
  ),
  search: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="40" fill="var(--color-primary-light)" />
      <circle cx="37" cy="37" r="13" stroke="var(--color-primary)" strokeWidth="2.5" fill="var(--color-surface)" />
      <line x1="46" y1="47" x2="58" y2="59" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="37" x2="42" y2="37" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" />
      <line x1="37" y1="32" x2="37" y2="42" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  'wifi-off': (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="40" fill="var(--color-primary-light)" />
      <path d="M24 34c4.4-4.4 10.4-7 16.5-7s12.1 2.6 16.5 7" stroke="var(--color-border)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M30 41c2.8-2.8 6.6-4.5 10.5-4.5" stroke="var(--color-border)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="40" cy="52" r="3.5" fill="var(--color-border)" />
      <line x1="20" y1="20" x2="60" y2="60" stroke="var(--color-error)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
};

export function EmptyState({ illustration, title, body, cta }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {ILLUSTRATIONS[illustration]}
      <h3>{title}</h3>
      <p>{body}</p>
      {cta && (
        cta.href ? (
          <Link
            href={cta.href}
            className={`btn-cta${cta.variant === 'gold' ? ' btn-cta--gold' : ''}`}
          >
            {cta.label}
          </Link>
        ) : (
          <button
            className={`btn-cta${cta.variant === 'gold' ? ' btn-cta--gold' : ''}`}
            onClick={cta.onClick}
          >
            {cta.label}
          </button>
        )
      )}
    </div>
  );
}
