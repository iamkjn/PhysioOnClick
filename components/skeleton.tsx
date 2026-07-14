interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

export function Skeleton({ width = '100%', height = '1.2em', className }: SkeletonProps) {
  return (
    <span
      className={`skeleton${className ? ` ${className}` : ''}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  lastLineWidth?: string;
}

export function SkeletonText({ lines = 1, lastLineWidth = '70%' }: SkeletonTextProps) {
  return (
    <div className="skeleton-text-group" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="0.9em"
          width={i === lines - 1 ? lastLineWidth : '100%'}
          className="skeleton-text-line"
        />
      ))}
    </div>
  );
}

export function SkeletonCircle({ size = '40px' }: { size?: string }) {
  return <Skeleton width={size} height={size} className="skeleton-circle" />;
}

export function SkeletonRow({ count = 1 }: { count?: number }) {
  return (
    <div className="skeleton-row-group" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-row" key={i}>
          <SkeletonCircle size="36px" />
          <div className="skeleton-row-lines">
            <Skeleton height="0.9em" width="60%" />
            <Skeleton height="0.75em" width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 4, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="skeleton-table" aria-hidden="true">
      <div className="skeleton-table-header">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height="0.8em" width="70%" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div className="skeleton-table-row" key={r}>
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} height="0.85em" width={c === 0 ? '85%' : '60%'} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 260 }: { height?: number }) {
  return (
    <div className="skeleton-chart" style={{ height: `${height}px` }} aria-hidden="true">
      <Skeleton width="100%" height="100%" className="skeleton-chart-block" />
    </div>
  );
}

export function SkeletonStatGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="skeleton-stat-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-stat-tile" key={i}>
          <Skeleton height="0.7em" width="50%" />
          <Skeleton height="2rem" width="70%" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonForm({ fields = 3 }: { fields?: number }) {
  return (
    <div className="skeleton-form" aria-hidden="true">
      {Array.from({ length: fields }).map((_, i) => (
        <div className="skeleton-form-field" key={i}>
          <Skeleton height="0.75em" width="30%" />
          <Skeleton height="2.4rem" width="100%" />
        </div>
      ))}
    </div>
  );
}
