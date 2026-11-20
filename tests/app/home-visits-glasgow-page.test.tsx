import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Page, { metadata } from "@/app/physiotherapy-home-visits-glasgow/page";
import { formatPounds, homeVisitPricePence, sessionPricePence } from "@/lib/home-visit-pricing";

// A home visit has one whole price (lib/home-visit-pricing), never a fee on top.
const home = formatPounds(homeVisitPricePence("initial-assessment"));
const homeFollowUp = formatPounds(homeVisitPricePence("follow-up"));
const video = formatPounds(sessionPricePence("initial-assessment"));

describe("physiotherapy-home-visits-glasgow", () => {
  it("has a home-visit title and description within limits", () => {
    const title = String(metadata.title);
    const desc = String(metadata.description);
    expect(title.length).toBeLessThanOrEqual(65);
    expect(title.toLowerCase()).toContain("home physiotherapy glasgow");
    expect(desc.length).toBeGreaterThanOrEqual(120);
    expect(desc.length).toBeLessThanOrEqual(160);
    expect(desc).toContain(home);
    expect(desc).toContain(`${homeFollowUp} follow-ups`);
  });

  it("states derived prices, coverage and the safety conditions", () => {
    const text = render(<Page />).container.textContent ?? "";
    expect(text).toMatch(new RegExp(`The initial home assessment is\\s+${home} all in, and follow-ups are ${homeFollowUp}\\.`));
    expect(text).toContain(
      `A home visit is one all-in price: ${home} for the initial assessment and ${homeFollowUp} for a follow-up, with nothing added at checkout (${video} for an assessment by video).`,
    );
    expect(text).not.toMatch(/travel fee/i);
    expect(text).not.toMatch(/assessment price plus/i);
    expect(text).toContain("Kilmarnock");
    expect(text).toContain("GP or specialist team must confirm");
    expect(text).toContain("responsible adult");
    expect(text).not.toMatch(/same prices|acupuncture is available/i);
  });
});

describe("physiotherapy-home-visits-glasgow NHS self-referral", () => {
  // NHSGGC's MSK self-referral page lists "require a home visit" among the
  // cases its form can't take (checked live 2026-11-20).
  const NHSGGC_SELF_REFERRAL =
    "https://www.nhsggc.scot/hospitals-services/services-a-to-z/musculoskeletal-msk-physiotherapy/self-referral-to-adult-msk-physiotherapy/";
  const plain = (s: string | null) => (s ?? "").replace(/’/g, "'");

  it("tells visitors NHSGGC self-referral can't be used for a home visit and links to the NHS page", () => {
    const { container } = render(<Page />);
    expect(plain(container.textContent)).toContain(
      "NHS Greater Glasgow and Clyde's physio self-referral can't be used if you need a home visit, but you can book one with us directly",
    );
    expect(container.querySelector(`a[href="${NHSGGC_SELF_REFERRAL}"]`)).not.toBeNull();
  });

  it("adds the NHS point to the GP-referral answer and keeps the signed-off safety rules word for word", () => {
    const { container } = render(<Page />);
    const faq = [...container.querySelectorAll('script[type="application/ld+json"]')]
      .map((s) => JSON.parse(s.textContent ?? "{}"))
      .find((j) => j["@type"] === "FAQPage");
    const answer: string = faq.mainEntity.find(
      (q: { name: string }) => q.name === "Do I need a GP referral for a home visit?",
    ).acceptedAnswer.text;
    expect(answer).toContain(
      "No, you can book directly, even though NHS Greater Glasgow and Clyde's online physio self-referral can't be used for a home visit.",
    );
    expect(answer).toContain("For neurological rehabilitation, your GP or specialist team must confirm it is safe for you to begin physiotherapy before you start.");
    expect(answer).toContain(
      "After an operation, rehab with us starts once your surgical team has said you are ready for outpatient or community physiotherapy, and we follow any restrictions or precautions they give you.",
    );
  });
});

describe("physiotherapy-home-visits-glasgow 3D explanation", () => {
  it("says a 3D model shows the area involved and the muscles each exercise works", () => {
    const text = render(<Page />).container.textContent ?? "";
    expect(text).toContain("A 3D model of the body on screen, to show you the area involved and the muscles each of your exercises works");
  });
});
