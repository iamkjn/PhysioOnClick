import { describe, it, expect, vi, afterEach } from "vitest";
import { buildReviewRequestEmailHtml, sendReviewRequestEmail } from "@/lib/emails/review-request-email";

describe("buildReviewRequestEmailHtml", () => {
  it("mentions Trustpilot and a coming invitation when no direct URL is given", () => {
    const html = buildReviewRequestEmailHtml({ patientName: "Anish George", referenceId: "bk_1" });
    expect(html).toContain("Anish George");
    expect(html).toMatch(/Trustpilot/);
    expect(html).toMatch(/invitation from/i);
    expect(html).not.toContain("Google");
    expect(html).toContain("Reference: bk_1");
    expect(html).not.toContain('href="undefined"');
  });

  it("renders a direct Trustpilot button when a URL is given", () => {
    const html = buildReviewRequestEmailHtml({
      patientName: "Jay",
      reviewUrl: "https://www.trustpilot.com/evaluate/physioonclick.co.uk",
    });
    expect(html).toContain('href="https://www.trustpilot.com/evaluate/physioonclick.co.uk"');
    expect(html).toMatch(/Review us on Trustpilot/);
  });

  it("escapes the patient name", () => {
    const html = buildReviewRequestEmailHtml({ patientName: '<script>x</script>' });
    expect(html).not.toContain("<script>x</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("sendReviewRequestEmail", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("BCCs the Trustpilot address on the Resend payload", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await sendReviewRequestEmail({
      to: "seena@example.com",
      bcc: "physioonclick.co.uk+abc@invite.trustpilot.com",
      patientName: "Anish",
      referenceId: "bk_9",
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.to).toEqual(["seena@example.com"]);
    expect(body.bcc).toEqual(["physioonclick.co.uk+abc@invite.trustpilot.com"]);
  });

  it("omits bcc when none is provided", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await sendReviewRequestEmail({ to: "x@example.com", patientName: "X" });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.bcc).toBeUndefined();
  });
});
