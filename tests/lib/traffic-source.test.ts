import { describe, expect, it } from "vitest";

import { channelLabel, classifyTrafficSource, cleanChannel, cleanReferrerHost } from "@/lib/traffic-source";

const FB_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 27_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/530.0.0.41.106;FBBV/1]";
const SAFARI = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const own = "physioonclick.co.uk";

describe("classifyTrafficSource", () => {
  it("spots a Facebook group visit from the in-app browser even with no referrer (the first patient's visit)", () => {
    expect(classifyTrafficSource({ userAgent: FB_IPHONE, ownHost: own })).toEqual({ channel: "facebook", referrerHost: "" });
  });

  it("uses Facebook's click id and its link-shim referrer", () => {
    expect(classifyTrafficSource({ search: "?fbclid=IwAR123", userAgent: SAFARI, ownHost: own }).channel).toBe("facebook");
    expect(classifyTrafficSource({ referrer: "https://l.facebook.com/l.php?u=x", userAgent: SAFARI, ownHost: own })).toEqual({
      channel: "facebook",
      referrerHost: "l.facebook.com",
    });
  });

  it.each([
    ["https://www.google.co.uk/", "google"],
    ["https://www.bing.com/search?q=physio", "bing"],
    ["https://chatgpt.com/", "chatgpt"],
    ["https://mail.google.com/mail/u/0/", "email"],
    ["android-app://com.google.android.gm/", "email"],
    ["https://www.trustpilot.com/review/physioonclick.co.uk", "trustpilot"],
    ["https://some-blog.example.org/post", "other"],
  ])("maps the referrer %s to %s", (referrer, channel) => {
    expect(classifyTrafficSource({ referrer, userAgent: SAFARI, ownHost: own }).channel).toBe(channel);
  });

  it("prefers an explicit utm_source", () => {
    expect(classifyTrafficSource({ search: "?utm_source=gbp&utm_medium=organic", ownHost: own }).channel).toBe("google");
    expect(classifyTrafficSource({ search: "?utm_source=Care Home Leaflet", ownHost: own }).channel).toBe("care-home-leaflet");
  });

  it("treats internal navigation and no evidence as direct", () => {
    expect(classifyTrafficSource({ referrer: "https://physioonclick.co.uk/pricing", userAgent: SAFARI, ownHost: own })).toEqual({
      channel: "direct",
      referrerHost: "",
    });
    expect(classifyTrafficSource({ userAgent: SAFARI, ownHost: "localhost:3000" }).channel).toBe("direct");
  });
});

describe("cleaning what a browser sends", () => {
  it("only accepts short slug channels", () => {
    expect(cleanChannel("facebook")).toBe("facebook");
    expect(cleanChannel("<script>")).toBe("");
    expect(cleanChannel("x".repeat(80))).toBe("");
    expect(cleanChannel(42)).toBe("");
  });

  it("only accepts bare host names", () => {
    expect(cleanReferrerHost("l.facebook.com")).toBe("l.facebook.com");
    expect(cleanReferrerHost("https://evil.example/?q=1")).toBe("");
    expect(cleanReferrerHost("localhost")).toBe("");
  });

  it("labels channels for people", () => {
    expect(channelLabel("facebook")).toBe("Facebook");
    expect(channelLabel("direct")).toBe("Direct or unknown");
    expect(channelLabel("care-home-leaflet")).toBe("care-home-leaflet");
  });
});
