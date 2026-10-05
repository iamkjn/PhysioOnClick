import { describe, it, expect } from "vitest";
import { buildAssessmentLinkEmailHtml, buildAssessmentLinkEmailText } from "@/lib/emails/assessment-link-email";

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

  it("shows the home visit address and omits the video join link for a home visit", () => {
    const html = buildAssessmentLinkEmailHtml({
      patientName: "Jane",
      serviceLabel: "Initial",
      assessmentUrl: "https://s/x",
      meetingUrl: "https://m/y",
      visitType: "home",
      homeVisitAddress: "7 Example <Street>, G31 4HS",
    });
    expect(html).toContain("Home visit at 7 Example &lt;Street&gt;, G31 4HS");
    expect(html).not.toContain("Join your appointment");
    expect(html).not.toContain("https://m/y");
  });

  it("keeps the join link for a video booking", () => {
    const html = buildAssessmentLinkEmailHtml({
      patientName: "Jane",
      serviceLabel: "Initial",
      assessmentUrl: "https://s/x",
      meetingUrl: "https://m/y",
      visitType: "video",
    });
    expect(html).toContain("Join your appointment");
    expect(html).not.toContain("Home visit at");
  });
});

describe("buildAssessmentLinkEmailText", () => {
  it("omits the join link and names the address for a home visit", () => {
    const text = buildAssessmentLinkEmailText({
      patientName: "Jane",
      serviceLabel: "Initial",
      assessmentUrl: "https://s/x",
      meetingUrl: "https://m/y",
      visitType: "home",
      homeVisitAddress: "7 Example Street, G31 4HS",
    });
    expect(text).toContain("Home visit at 7 Example Street, G31 4HS");
    expect(text).not.toContain("https://m/y");
  });
});
