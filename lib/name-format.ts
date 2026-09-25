const WORD_BOUNDARY = /([\s\-'])/;

function formatNamePart(part: string): string {
  if (!part) return part;
  if (part.length === 1) return part.toUpperCase();
  return `${part[0].toUpperCase()}${part.slice(1).toLowerCase()}`;
}

export function formatPersonName(value: string | null | undefined, fallback = "Patient"): string {
  const trimmed = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!trimmed) return fallback;
  if (trimmed.includes("@")) return trimmed;
  return trimmed
    .split(WORD_BOUNDARY)
    .map((part) => (WORD_BOUNDARY.test(part) ? part : formatNamePart(part)))
    .join("");
}
