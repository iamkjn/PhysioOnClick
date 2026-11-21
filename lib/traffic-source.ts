/**
 * Where a website visit came from (Facebook, Google, direct...), for the admin
 * Growth tab. Shared by the browser tracker, which sees the referrer and the
 * landing URL, and the tracking route, which falls back to the user agent for
 * clients that didn't send a source.
 *
 * Only a channel name and the referring site's host name are kept: never the
 * full referring URL, its query string or any click id value.
 */

export type TrafficSourceInput = {
  /** document.referrer, the full URL of the page the visitor came from. */
  referrer?: string;
  /** location.search of the landing page, e.g. "?fbclid=..." */
  search?: string;
  userAgent?: string;
  /** This site's host, so internal navigation isn't counted as a referral. */
  ownHost?: string;
};

export type TrafficSource = { channel: string; referrerHost: string };

const CHANNEL_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  google: "Google",
  "google-ads": "Google Ads",
  bing: "Bing",
  "bing-ads": "Bing Ads",
  duckduckgo: "DuckDuckGo",
  yahoo: "Yahoo",
  ecosia: "Ecosia",
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  whatsapp: "WhatsApp",
  email: "Email",
  x: "X (Twitter)",
  linkedin: "LinkedIn",
  reddit: "Reddit",
  nextdoor: "Nextdoor",
  trustpilot: "Trustpilot",
  direct: "Direct or unknown",
  other: "Other website",
};

// Checked in order; the first host pattern that matches wins. Email webmail
// comes before Google/Yahoo so mail.google.com counts as email.
const HOST_CHANNELS: Array<[RegExp, string]> = [
  [/(^|\.)(mail\.google\.com|outlook\.(live|office)\.com|mail\.yahoo\.com|webmail\.|mail\.ionos\.|email\.ionos\.)|^com\.google\.android\.gm$|^com\.microsoft\.office\.outlook$/, "email"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/, "facebook"],
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)google\.[a-z.]+$|^com\.google\.android\.googlequicksearchbox$/, "google"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)duckduckgo\.com$/, "duckduckgo"],
  [/(^|\.)yahoo\.[a-z.]+$/, "yahoo"],
  [/(^|\.)ecosia\.org$/, "ecosia"],
  [/(^|\.)(chatgpt\.com|openai\.com)$/, "chatgpt"],
  [/(^|\.)perplexity\.ai$/, "perplexity"],
  [/(^|\.)(wa\.me|whatsapp\.com)$/, "whatsapp"],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, "x"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, "linkedin"],
  [/(^|\.)reddit\.com$/, "reddit"],
  [/(^|\.)nextdoor\.(com|co\.uk)$/, "nextdoor"],
  [/(^|\.)trustpilot\.com$/, "trustpilot"],
];

// In-app browsers often send no referrer at all; their user agent still says
// which app the link was tapped in.
const USER_AGENT_CHANNELS: Array<[RegExp, string]> = [
  [/FBAN|FBAV|FB_IAB|FBIOS|FB4A|FBMD/, "facebook"],
  [/Instagram/, "instagram"],
  [/\bGSA\/\d/, "google"],
];

const CHANNEL_PATTERN = /^[a-z0-9][a-z0-9.-]{0,39}$/;
const HOST_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

/** Human label for a stored channel, e.g. "facebook" → "Facebook". */
export function channelLabel(channel: string): string {
  const known = CHANNEL_LABELS[channel];
  if (known) return known;
  // A tagged link such as ?utm_source=fb-east-kilbride → "Facebook · East Kilbride",
  // so each group post shows as its own source.
  const tagged = channel.match(/^(fb|ig|gbp)-(.+)$/);
  if (tagged) {
    const network = { fb: "Facebook", ig: "Instagram", gbp: "Google Business Profile" }[tagged[1] as "fb" | "ig" | "gbp"];
    const place = tagged[2].split(/[-.]+/).filter(Boolean).map((w) => w[0]!.toUpperCase() + w.slice(1)).join(" ");
    return `${network} · ${place}`;
  }
  return channel;
}

/** Validates a channel sent by a browser; returns "" if it isn't a plain short slug. */
export function cleanChannel(value: unknown): string {
  if (typeof value !== "string") return "";
  const channel = value.trim().toLowerCase();
  return CHANNEL_PATTERN.test(channel) ? channel : "";
}

/** Validates a referring host name; returns "" for anything that isn't one. */
export function cleanReferrerHost(value: unknown): string {
  if (typeof value !== "string") return "";
  const host = value.trim().toLowerCase().slice(0, 100);
  return HOST_PATTERN.test(host) ? host : "";
}

function channelFromHost(host: string): string {
  return HOST_CHANNELS.find(([pattern]) => pattern.test(host))?.[1] ?? "other";
}

function channelFromUtm(source: string): string {
  const value = source.trim().toLowerCase();
  // A tag naming the post's place (fb-east-kilbride) is kept whole so the
  // Growth tab can tell group posts apart; channelLabel() makes it readable.
  const tagged = cleanChannel(value.replace(/[^a-z0-9.-]+/g, "-"));
  if (/^(fb|ig|gbp)-[a-z0-9]/.test(tagged)) return tagged;
  if (/facebook|^fb$/.test(value)) return "facebook";
  if (/instagram|^ig$/.test(value)) return "instagram";
  if (/google|^gbp$|^gmb$/.test(value)) return "google";
  if (/chatgpt|openai/.test(value)) return "chatgpt";
  return cleanChannel(value.replace(/[^a-z0-9.-]+/g, "-").replace(/^-+|-+$/g, "")) || "other";
}

function hostOf(referrer: string): string {
  if (!referrer) return "";
  try {
    const url = new URL(referrer);
    // Android apps refer as android-app://com.google.android.gm/... etc.
    return url.protocol === "android-app:" ? url.hostname || url.pathname.split("/")[0] || "" : url.hostname;
  } catch {
    return "";
  }
}

function isOwnHost(host: string, ownHost?: string): boolean {
  const own = (ownHost ?? "").toLowerCase().replace(/:\d+$/, "");
  if (own && (host === own || host.endsWith(`.${own}`) || own.endsWith(`.${host}`))) return true;
  return host === "physioonclick.co.uk" || host.endsWith(".physioonclick.co.uk");
}

/**
 * Classifies a visit. Order of evidence: an explicit utm_source, an ad/social
 * click id in the landing URL, the in-app browser's user agent, then the
 * referring site. Anything else is "direct".
 */
export function classifyTrafficSource({ referrer = "", search = "", userAgent = "", ownHost }: TrafficSourceInput): TrafficSource {
  const host = hostOf(referrer).toLowerCase();
  const external = host && !isOwnHost(host, ownHost) ? cleanReferrerHost(host) : "";

  let params: URLSearchParams | null = null;
  try {
    params = new URLSearchParams(search);
  } catch {
    params = null;
  }
  const utm = params?.get("utm_source") ?? "";
  if (utm) return { channel: channelFromUtm(utm), referrerHost: external };
  if (params?.has("fbclid")) return { channel: "facebook", referrerHost: external };
  if (params?.has("gclid") || params?.has("gbraid") || params?.has("wbraid")) return { channel: "google-ads", referrerHost: external };
  if (params?.has("msclkid")) return { channel: "bing-ads", referrerHost: external };

  const appChannel = USER_AGENT_CHANNELS.find(([pattern]) => pattern.test(userAgent))?.[1];
  if (appChannel) return { channel: appChannel, referrerHost: external };

  if (external) return { channel: channelFromHost(external), referrerHost: external };
  return { channel: "direct", referrerHost: "" };
}
