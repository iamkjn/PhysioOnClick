import { NextResponse } from "next/server";

const specialisms = {
  "arthroplasty-rehabilitation": {
    title: "Arthroplasty Rehabilitation",
    label: "Orthopaedic recovery",
    start: "#dcecff",
    end: "#f7fbff",
    accent: "#2378c7",
    motif: `<path d="M842 336H988M842 370H988M870 298H960" stroke="#2378c7" stroke-width="16" stroke-linecap="round" stroke-opacity="0.32"/>`
  },
  "neurological-rehabilitation": {
    title: "Neurological Rehabilitation",
    label: "Neuro physio",
    start: "#e4f7ff",
    end: "#fbfeff",
    accent: "#1085a8",
    motif: `<path d="M858 324C858 294 882 270 912 270C942 270 966 294 966 324C966 339 960 352 950 362C934 377 932 400 943 422C949 433 952 445 952 457C952 482 932 502 907 502C882 502 862 482 862 457C862 445 866 433 873 421C887 399 885 377 871 362C863 353 858 339 858 324Z" stroke="#1085a8" stroke-width="14" stroke-opacity="0.34" fill="none"/>`
  },
  "paediatric-physiotherapy": {
    title: "Paediatric Physiotherapy",
    label: "Child-centred support",
    start: "#e5f6ef",
    end: "#fbfefc",
    accent: "#228b62",
    motif: `<circle cx="911" cy="316" r="40" fill="#228b62" fill-opacity="0.18"/><circle cx="911" cy="398" r="56" fill="#228b62" fill-opacity="0.12"/><path d="M870 466C885 437 904 425 911 425C918 425 937 437 952 466" stroke="#228b62" stroke-width="14" stroke-linecap="round" stroke-opacity="0.3"/>`
  },
  "research-and-innovation": {
    title: "Research & Innovation",
    label: "Technology-led rehab",
    start: "#efe9ff",
    end: "#fbf9ff",
    accent: "#7250c6",
    motif: `<rect x="848" y="282" width="126" height="190" rx="24" fill="#ffffff" fill-opacity="0.76"/><rect x="875" y="320" width="72" height="92" rx="14" fill="#7250c6" fill-opacity="0.12"/><circle cx="911" cy="438" r="8" fill="#7250c6" fill-opacity="0.26"/>`
  }
} as const;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = specialisms[slug as keyof typeof specialisms];

  if (!item) {
    return new NextResponse("Not found", { status: 404 });
  }

  const svg = `
    <svg width="1200" height="680" viewBox="0 0 1200 680" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="aboutBg" x1="90" y1="70" x2="1060" y2="600" gradientUnits="userSpaceOnUse">
          <stop stop-color="${item.start}" />
          <stop offset="1" stop-color="${item.end}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="680" rx="34" fill="url(#aboutBg)" />
      <circle cx="1050" cy="120" r="150" fill="${item.accent}" fill-opacity="0.06" />
      <circle cx="1115" cy="560" r="175" fill="${item.accent}" fill-opacity="0.04" />
      <rect x="82" y="84" width="210" height="44" rx="22" fill="#ffffff" fill-opacity="0.9" />
      <text x="112" y="113" font-size="24" font-family="Arial, Helvetica, sans-serif" fill="${item.accent}" font-weight="700">PhysioOnClick</text>
      <rect x="82" y="152" width="238" height="40" rx="20" fill="${item.accent}" fill-opacity="0.1" />
      <text x="110" y="178" font-size="18" font-family="Arial, Helvetica, sans-serif" fill="${item.accent}" font-weight="700">${escapeXml(
        item.label
      )}</text>
      <text x="82" y="278" font-size="60" font-family="Arial, Helvetica, sans-serif" fill="#162232" font-weight="800">${escapeXml(
        item.title.split(" ")[0]
      )}</text>
      <text x="82" y="348" font-size="60" font-family="Arial, Helvetica, sans-serif" fill="#162232" font-weight="800">${escapeXml(
        item.title.split(" ").slice(1).join(" ")
      )}</text>
      <text x="82" y="520" font-size="26" font-family="Arial, Helvetica, sans-serif" fill="#58697d">Evidence-based Glasgow and UK-wide rehabilitation</text>
      <rect x="796" y="204" width="230" height="308" rx="40" fill="#ffffff" fill-opacity="0.78" />
      <circle cx="911" cy="256" r="52" fill="${item.accent}" fill-opacity="0.1" />
      ${item.motif}
    </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
