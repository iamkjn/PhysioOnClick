export function formatGbp(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function issuerField(value: string, fallback = "[registration pending]"): string {
  return value && value.trim() ? value : fallback;
}

/**
 * Deterministic, human-readable invoice number derived from a stable seed
 * (the Stripe session id) so a webhook retry never renumbers an invoice.
 * Format: INV-<year>-<6 base36 chars>.
 */
export function makeInvoiceNumber(seed: string, date: Date = new Date()): string {
  // Two independent 32-bit rolling hashes widen the space to ~10 base36 chars,
  // making cross-patient collisions on the same INV-YYYY-XXXXXXXX negligible
  // while staying deterministic in the Stripe session id (retry-stable).
  let h1 = 0;
  let h2 = 0;
  for (let i = 0; i < seed.length; i++) {
    h1 = (h1 * 31 + seed.charCodeAt(i)) >>> 0;
    h2 = (h2 * 131 + seed.charCodeAt(i) * 7 + 13) >>> 0;
  }
  const code = (h1.toString(36) + h2.toString(36)).toUpperCase().padStart(8, "0").slice(-8);
  return `INV-${date.getUTCFullYear()}-${code}`;
}
