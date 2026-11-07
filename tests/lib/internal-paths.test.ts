import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { internalVisitGuardScript, isInternalLocation } from "@/lib/internal-paths";

const LIVE = "https://physioonclick.co.uk";
const TEST_SITE = "https://dev.physioonclick.co.uk";

// Vitest's jsdom environment exposes the JSDOM instance, which is the only way to
// change the page's hostname: window.location can't be reassigned.
function visit(url: string) {
  (globalThis as unknown as { jsdom: { reconfigure(options: { url: string }): void } }).jsdom.reconfigure({ url });
}

const flag = (id: string) => (window as unknown as Record<string, unknown>)[`ga-disable-${id}`];

describe("isInternalLocation", () => {
  const live = (pathname: string) => isInternalLocation({ hostname: "physioonclick.co.uk", pathname });

  it("treats the admin area as internal", () => {
    expect(live("/admin")).toBe(true);
    expect(live("/admin/patients/abc")).toBe(true);
  });

  it("keeps patient-facing pages on the live site", () => {
    expect(live("/")).toBe(false);
    expect(live("/book")).toBe(false);
    expect(live("/patient")).toBe(false);
    expect(live("/administration-guide")).toBe(false);
  });

  it("treats every page of any other copy of the site as internal", () => {
    expect(isInternalLocation({ hostname: "dev.physioonclick.co.uk", pathname: "/book" })).toBe(true);
    expect(isInternalLocation({ hostname: "localhost", pathname: "/" })).toBe(true);
  });
});

describe("internalVisitGuardScript", () => {
  const originalPush = window.history.pushState;
  const originalReplace = window.history.replaceState;

  const runGuard = () => new Function(internalVisitGuardScript(["G-ONE", "G-TWO"]))();

  afterEach(() => {
    window.history.pushState = originalPush;
    window.history.replaceState = originalReplace;
    visit("http://localhost:3000/");
  });

  it("turns analytics off for every id when a page loads directly on /admin", () => {
    visit(`${LIVE}/admin/patients`);
    runGuard();
    expect(flag("G-ONE")).toBe(true);
    expect(flag("G-TWO")).toBe(true);
  });

  it("leaves analytics on for a patient-facing page of the live site", () => {
    visit(`${LIVE}/`);
    runGuard();
    expect(flag("G-ONE")).toBe(false);
    expect(flag("G-TWO")).toBe(false);
  });

  it("turns analytics off on the test site, even on public pages", () => {
    visit(`${TEST_SITE}/book`);
    runGuard();
    expect(flag("G-ONE")).toBe(true);
    window.history.pushState({}, "", "/pricing");
    expect(flag("G-ONE")).toBe(true);
  });

  it("is already off when gtag's own history listener would fire", () => {
    visit(`${LIVE}/`);
    runGuard();
    // gtag.js wraps pushState after this script and fires once the call returns.
    const guarded = window.history.pushState;
    let seenByGtag: unknown;
    window.history.pushState = function (...args: Parameters<History["pushState"]>) {
      guarded.apply(window.history, args);
      seenByGtag = flag("G-ONE");
    };
    window.history.pushState({}, "", "/admin");
    expect(seenByGtag).toBe(true);
  });

  it("turns back on when leaving the admin area, by link or back button", () => {
    visit(`${LIVE}/`);
    runGuard();
    window.history.pushState({}, "", "/admin");
    expect(flag("G-ONE")).toBe(true);

    window.history.pushState({}, "", "/services");
    expect(flag("G-ONE")).toBe(false);

    window.history.replaceState({}, "", "/admin/sessions");
    expect(flag("G-ONE")).toBe(true);

    originalPush.call(window.history, {}, "", "/pricing");
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(flag("G-ONE")).toBe(false);
  });
});

describe("track", () => {
  const logEvent = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    logEvent.mockClear();
    vi.doMock("firebase/analytics", () => ({
      logEvent: (...args: unknown[]) => logEvent(...args),
      getAnalytics: vi.fn(() => ({})),
      isSupported: vi.fn(async () => true),
    }));
    vi.doMock("@/lib/firebase", () => ({ firebaseApp: {}, firebaseMeasurementId: "G-TEST" }));
  });

  afterEach(() => {
    window.localStorage.clear();
    visit("http://localhost:3000/");
    vi.doUnmock("firebase/analytics");
    vi.doUnmock("@/lib/firebase");
  });

  const trackAt = async (url: string) => {
    visit(url);
    window.localStorage.setItem("poc-cookie-consent", "granted");
    const { track } = await import("@/lib/analytics");
    track("book_now_click");
    await new Promise((resolve) => setTimeout(resolve, 20));
  };

  it("logs on a patient-facing page of the live site", async () => {
    await trackAt(`${LIVE}/services`);
    expect(logEvent).toHaveBeenCalledTimes(1);
  });

  it("logs nothing on an admin page, even with consent", async () => {
    await trackAt(`${LIVE}/admin/patients`);
    expect(logEvent).not.toHaveBeenCalled();
  });

  it("logs nothing on the test site, even with consent", async () => {
    await trackAt(`${TEST_SITE}/services`);
    expect(logEvent).not.toHaveBeenCalled();
  });
});
