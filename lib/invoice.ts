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
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const code = hash.toString(36).toUpperCase().padStart(6, "0").slice(-6);
  return `INV-${date.getUTCFullYear()}-${code}`;
}
