"use client";

const COLOURS = [
  "var(--color-primary)",
  "var(--color-accent)",
  "var(--color-gold)",
  "var(--color-warning)",
  "var(--color-error)",
  "var(--color-primary-dark)",
  "var(--color-success)",
  "var(--book-rail-top)",
];

function avatarColor(name: string): string {
  if (!name) return COLOURS[0];
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return COLOURS[hash % COLOURS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ name, imageUrl, size = 48, className = "" }: AvatarProps) {
  const px = `${size}px`;
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        width={size}
        height={size}
        style={{ width: px, height: px, borderRadius: "50%", objectFit: "cover" }}
        className={className}
      />
    );
  }
  return (
    <div
      style={{
        width: px,
        height: px,
        borderRadius: "50%",
        background: avatarColor(name),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: 700,
        fontSize: size * 0.38,
        flexShrink: 0,
      }}
      className={className}
    >
      {initials(name)}
    </div>
  );
}
