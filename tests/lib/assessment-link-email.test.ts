import { describe, it, expect } from "vitest";
import { buildAssessmentLinkEmailHtml } from "@/lib/emails/assessment-link-email";

describe("buildAssessmentLinkEmailHtml", () => {
  it("includes CTA, pre-appointment copy, and conditional meeting link", () => {
    const html = buildAssessmentLinkEmailHtml({
      patientName: "A <b>",
      serviceLabel: "Initial",
      assessmentUrl: "https://s/x",
      meetingUrl: "https://m/y",
    });
    expect(html).toContain("https://s/x");
    expect(html).toContain("before your appointment");
    expect(html).toContain("helps us make the most of your session");
    expect(html).toContain("https://m/y");
    expect(html).toContain("Join your appointment");
    expect(html).not.toContain("A <b>"); // escaped
  });

  it("omits meeting link markup when meetingUrl is not provided", () => {
    const html = buildAssessmentLinkEmailHtml({
      patientName: "Jane",
      serviceLabel: "Initial",
      assessmentUrl: "https://s/x",
    });
    expect(html).not.toContain("Join your appointment");
  });
});
