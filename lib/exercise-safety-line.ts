// The safety line is the final `mistakes` entry when it reads as a caution
// ("stop", "seek", "pain", "don't push"); otherwise every mistake renders
// normally and the callout carries a generic caution. Deterministic so the
// static export, the embed and the tests agree.
const SAFETY_CAUTION = /\b(stop|seek|pain|don'?t push|do not push)\b/i;
export const GENERIC_SAFETY =
  "Stop and seek advice if an exercise causes sharp or lasting pain.";

export function splitMistakes(mistakes: string[]): {
  ordinary: string[];
  safety: string;
} {
  const last = mistakes[mistakes.length - 1];
  if (last && SAFETY_CAUTION.test(last)) {
    return { ordinary: mistakes.slice(0, -1), safety: last };
  }
  return { ordinary: mistakes, safety: GENERIC_SAFETY };
}
