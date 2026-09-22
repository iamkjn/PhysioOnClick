// Physios often type session notes quickly in lowercase with no closing
// punctuation (e.g. "initial assessment of foot pain..."). This is a display
// polish, not a spelling/grammar fixer: it only capitalizes the first letter
// and adds a trailing full stop when one is missing, leaving the rest of the
// text — including mid-sentence casing — exactly as typed.
export function formatClinicalNote(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  const capitalized = trimmed[0].toUpperCase() + trimmed.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}
