import { isValidElement, type ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

// The guard is the first statement of the consent-default inline script, which
// must run before gtag.js loads. Read it straight off the returned elements.
async function consentScript(): Promise<string> {
  vi.resetModules();
  const { Analytics } = await import("@/components/analytics");
  const fragment = Analytics() as ReactElement<{ children: ReactElement<{ id?: string; children: string }>[] }>;
  const script = fragment.props.children.find((child) => isValidElement(child) && child.props.id === "ga-consent-default");
  return script?.props.children ?? "";
}

describe("Analytics", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("switches off every Google tag on the page during internal visits", async () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-GTAGJS");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID", "G-FIREBASE");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_ID", "G-ADSSETTING");
    const script = await consentScript();
    expect(script).toContain('var ids = ["G-GTAGJS","G-FIREBASE","G-ADSSETTING"]');
    expect(script.indexOf("ga-disable-")).toBeLessThan(script.indexOf("gtag('consent', 'default'"));
  });

  it("lists a shared id once", async () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-SAME");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID", "G-SAME");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_ID", "");
    expect(await consentScript()).toContain('var ids = ["G-SAME"]');
  });
});
