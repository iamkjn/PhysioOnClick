import { describe, expect, it } from "vitest";

import { parseVisitRequest, timeLabels, visitRequestErrorFields, visitRequestErrors } from "@/lib/visit-request";

describe("visitRequestErrorFields", () => {
  it("lists each blocked field as missing or not accepted, in form order, without the values", () => {
    const input = { name: "", phone: "12345", postcode: "", note: "" };
    expect(visitRequestErrorFields(input, visitRequestErrors(input))).toBe("name:missing,phone:invalid,postcode:missing");
  });

  it("is empty when nothing is wrong", () => {
    const input = { name: "Jo Bloggs", phone: "07518 953611", postcode: "G72 8FE" };
    expect(visitRequestErrorFields(input, visitRequestErrors(input))).toBe("");
  });

  it("counts a note that is too long as not accepted", () => {
    const input = { name: "Jo Bloggs", phone: "07518 953611", postcode: "G72 8FE", note: "x".repeat(501) };
    expect(visitRequestErrorFields(input, visitRequestErrors(input))).toBe("note:invalid");
  });
});

describe("visit request rules", () => {
  it("accepts just a name, phone and postcode, and normalises the postcode", () => {
    const parsed = parseVisitRequest({ name: "John Smith", phone: "07518 953611", postcode: "g728fe" });
    expect(parsed).toEqual({
      value: { name: "John Smith", phone: "07518 953611", postcode: "G72 8FE", covered: true, times: [], note: "" },
    });
  });

  it("marks postcodes outside the home-visit area but still accepts them", () => {
    const parsed = parseVisitRequest({ name: "Ann Lee", phone: "+44 7700 900123", postcode: "EH1 1AA" });
    expect("value" in parsed && parsed.value.covered).toBe(false);
  });

  it("keeps only known visit times, once each", () => {
    const parsed = parseVisitRequest({
      name: "Ann Lee",
      phone: "07700900123",
      postcode: "G31 4HS",
      times: ["saturday", "saturday", "midnight", 3],
    });
    expect("value" in parsed && parsed.value.times).toEqual(["saturday"]);
    expect(timeLabels(["sunday", "weekday-evening"])).toEqual(["Weekday evening (6pm–9pm)", "Sunday"]);
  });

  it("explains what's missing, field by field", () => {
    expect(visitRequestErrors({ name: "", phone: "", postcode: "" })).toEqual({
      name: expect.any(String),
      phone: "Add a phone number so we can call you back.",
      postcode: "Add your postcode so we know where to visit.",
    });
    expect(visitRequestErrors({ name: "Jo Bloggs", phone: "12345", postcode: "G72" })).toEqual({
      phone: "Enter a UK phone number, e.g. 07123 456789.",
      postcode: "Enter a full UK postcode, e.g. G72 8FE.",
    });
  });

  it("rejects a request without a phone number", () => {
    expect(parseVisitRequest({ name: "Jo Bloggs", phone: "", postcode: "G72 8FE" })).toEqual({
      error: "Add a phone number so we can call you back.",
    });
  });
});
