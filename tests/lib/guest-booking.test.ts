import { afterEach, describe, expect, it } from "vitest";
import type { User } from "firebase/auth";

import {
  accountUserOrNull,
  forgetGuestBooking,
  guestBookingFor,
  guestBookingMatches,
  guestBookingOwnerFields,
  readGuestBooking,
  rememberGuestBooking,
} from "@/lib/guest-booking";

const anon = (uid: string) => ({ uid, isAnonymous: true }) as unknown as User;
const account = (uid: string) => ({ uid, isAnonymous: false }) as unknown as User;

afterEach(() => {
  window.localStorage.clear();
});

describe("accountUserOrNull", () => {
  it("treats an anonymous guest-checkout session as signed out", () => {
    expect(accountUserOrNull(anon("a1"))).toBeNull();
  });

  it("passes a real account and null straight through", () => {
    const user = account("u1");
    expect(accountUserOrNull(user)).toBe(user);
    expect(accountUserOrNull(null)).toBeNull();
  });
});

describe("guest booking record", () => {
  it("round-trips uid and a normalised email", () => {
    rememberGuestBooking("a1", "  Alex@Example.COM ");
    expect(readGuestBooking()).toEqual({ uid: "a1", email: "alex@example.com" });
    forgetGuestBooking();
    expect(readGuestBooking()).toBeNull();
  });

  it("ignores malformed stored values", () => {
    window.localStorage.setItem("poc-guest-booking", "{not json");
    expect(readGuestBooking()).toBeNull();
    window.localStorage.setItem("poc-guest-booking", JSON.stringify({ uid: 1, email: "x@y.z" }));
    expect(readGuestBooking()).toBeNull();
    window.localStorage.setItem("poc-guest-booking", JSON.stringify({ uid: "", email: "x@y.z" }));
    expect(readGuestBooking()).toBeNull();
  });

  it("only belongs to the anonymous session that created it", () => {
    rememberGuestBooking("a1", "alex@example.com");
    expect(guestBookingFor(anon("a1"))).toEqual({ uid: "a1", email: "alex@example.com" });
    expect(guestBookingFor(anon("someone-else"))).toBeNull();
    // A real account with the same uid (i.e. already upgraded) is not a guest.
    expect(guestBookingFor(account("a1"))).toBeNull();
    expect(guestBookingFor(null)).toBeNull();
  });

  it("matches only the same session AND the same email (shared-device guard)", () => {
    rememberGuestBooking("a1", "alex@example.com");
    expect(guestBookingMatches(anon("a1"), "ALEX@example.com ")).toBe(true);
    expect(guestBookingMatches(anon("a1"), "sam@example.com")).toBe(false);
    expect(guestBookingMatches(anon("a2"), "alex@example.com")).toBe(false);
  });
});

describe("guestBookingOwnerFields", () => {
  it("attaches a self booking to the assessment owner", () => {
    expect(
      guestBookingOwnerFields({ assessmentUid: "a1", assessmentPersonId: "a1", patientName: "Alex Morgan" }),
    ).toEqual({
      bookedBy: "a1",
      patientType: "self",
      patientId: "a1",
      patientName: "Alex Morgan",
      patientAvatarUrl: "",
    });
  });

  it("marks a different person id as a dependent", () => {
    expect(
      guestBookingOwnerFields({ assessmentUid: "u1", assessmentPersonId: "dep1", patientName: "Kid" }).patientType,
    ).toBe("dependent");
  });
});
