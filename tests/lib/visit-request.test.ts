import { describe, expect, it } from "vitest";

import { parseVisitRequest, timeLabels, visitRequestErrorFields, visitRequestErrors } from "@/lib/visit-request";

describe("visitRequestErrorFields", () => {
  const ok = { name: "Jo Bloggs", phone: "07518 953611", email: "jo@example.com", quick: true };
  const fields = (input: typeof ok & { note?: string }) => visitRequestErrorFields(input, visitRequestErrors(input));

  it("lists each blocked field as missing or not accepted, in form order, without the values", () => {
    expect(fields({ ...ok, name: "", phone: "12345", email: "" })).toBe("name:missing,phone:invalid,email:missing");
  });

  it("is empty when nothing is wrong", () => {
    expect(fields(ok)).toBe("");
  });

  it("counts a note that is too long as not accepted", () => {
    expect(fields({ ...ok, note: "x".repeat(501) })).toBe("note:invalid");
  });
});

const full = {
  name: "John Smith",
  phone: "07518 953611",
  email: "john@example.com",
  postcode: "g728fe",
  town: "Cambuslang",
  gender: "male",
  dateOfBirth: "1950-04-02",
  preferredDate: "2026-11-27",
  preferredTime: "evening",
  consent: true,
};

describe("visit request rules", () => {
  it("accepts a full request with no emergency contact and normalises the postcode", () => {
    const parsed = parseVisitRequest(full);
    expect("value" in parsed && parsed.value).toMatchObject({
      postcode: "G72 8FE", covered: true, emergencyName: "", emergencyPhone: "", quick: false, visitType: "home",
    });
  });

  it("marks postcodes outside the home-visit area but still accepts them", () => {
    const parsed = parseVisitRequest({ ...full, postcode: "EH1 1AA" });
    expect("value" in parsed && parsed.value.covered).toBe(false);
  });

  it("keeps only known visit times, once each", () => {
    const parsed = parseVisitRequest({ ...full, times: ["saturday", "saturday", "midnight", 3] });
    expect("value" in parsed && parsed.value.times).toEqual(["saturday"]);
    expect(timeLabels(["sunday", "weekday-evening", "weekday-day"])).toEqual([
      "Weekday daytime (9am–5pm)",
      "Weekday evening (5pm–9pm)",
      "Sunday",
    ]);
  });

  it("explains what's missing, field by field", () => {
    expect(Object.keys(visitRequestErrors({ name: "", phone: "", email: "" })).sort()).toEqual(
      ["dateOfBirth", "email", "gender", "name", "phone", "postcode", "preferredDate", "preferredTime", "town"],
    );
    expect(Object.keys(visitRequestErrors({ name: "", phone: "", email: "", quick: true })).sort()).toEqual(
      ["email", "name", "phone"],
    );
  });
});
