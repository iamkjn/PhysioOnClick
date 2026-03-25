import type { Service } from "@/lib/site-data";

const serviceStyles: Record<string, { start: string; end: string; accent: string; label: string }> = {
  "musculoskeletal-physiotherapy": {
    start: "#dcecff",
    end: "#f7fbff",
    accent: "#1d79c8",
    label: "Musculoskeletal care"
  },
  "post-surgical-rehabilitation": {
    start: "#e2f1ff",
    end: "#f9fcff",
    accent: "#2372c4",
    label: "Post-operative rehab"
  },
  "neurological-rehabilitation": {
    start: "#e4f7ff",
    end: "#fbfeff",
    accent: "#1186a8",
    label: "Neurological rehab"
  },
  "paediatric-physiotherapy": {
    start: "#e6f7ef",
    end: "#fbfefc",
    accent: "#238a61",
    label: "Paediatric support"
  },
  "gait-and-mobility-assessment": {
    start: "#eef3fb",
    end: "#fbfdff",
    accent: "#4d6f98",
    label: "Mobility assessment"
  },
  "online-rehab-programmes": {
    start: "#efe9ff",
    end: "#fbf9ff",
    accent: "#7250c6",
    label: "Digital rehab"
  }
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapLines(text: string, maxLength: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length <= maxLength) {
      current = next;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines.slice(0, 3);
}

export function generateServiceCoverSvg(service: Service) {
  const style = serviceStyles[service.slug] || serviceStyles["musculoskeletal-physiotherapy"];
  const titleLines = wrapLines(service.title, 20);
  const summaryLine = service.summary.replace(/\.$/, "").slice(0, 72);
  const motif =
    service.slug === "musculoskeletal-physiotherapy"
      ? `<path d="M860 286C834 318 828 361 846 396C858 419 856 450 842 478" stroke="${style.accent}" stroke-width="16" stroke-linecap="round" stroke-opacity="0.34"/>`
      : service.slug === "post-surgical-rehabilitation"
        ? `<path d="M820 350H972M820 386H972M850 312H944" stroke="${style.accent}" stroke-width="16" stroke-linecap="round" stroke-opacity="0.32"/>`
        : service.slug === "neurological-rehabilitation"
          ? `<path d="M839 332C839 300 865 274 897 274C929 274 955 300 955 332C955 349 948 363 937 374C920 390 918 415 930 438C937 450 940 463 940 476C940 503 918 525 891 525C864 525 842 503 842 476C842 463 846 450 854 437C869 414 867 390 852 373C844 364 839 349 839 332Z" stroke="${style.accent}" stroke-width="14" stroke-opacity="0.34" fill="none"/>`
          : service.slug === "paediatric-physiotherapy"
            ? `<circle cx="898" cy="324" r="42" fill="${style.accent}" fill-opacity="0.18"/><circle cx="898" cy="412" r="60" fill="${style.accent}" fill-opacity="0.12"/><path d="M854 484C870 452 891 438 898 438C905 438 926 452 942 484" stroke="${style.accent}" stroke-width="15" stroke-linecap="round" stroke-opacity="0.3"/>`
            : service.slug === "gait-and-mobility-assessment"
              ? `<path d="M872 288C889 320 891 358 879 392C869 421 868 455 879 492" stroke="${style.accent}" stroke-width="16" stroke-linecap="round" stroke-opacity="0.32"/><path d="M925 288C912 317 910 352 922 384C932 412 934 449 923 492" stroke="${style.accent}" stroke-width="16" stroke-linecap="round" stroke-opacity="0.32"/>`
              : `<rect x="826" y="280" width="154" height="232" rx="30" fill="#ffffff" fill-opacity="0.76"/><rect x="860" y="324" width="86" height="114" rx="18" fill="${style.accent}" fill-opacity="0.12"/><circle cx="903" cy="470" r="9" fill="${style.accent}" fill-opacity="0.26"/>`;

  return `
    <svg width="1200" height="680" viewBox="0 0 1200 680" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="serviceBg" x1="90" y1="70" x2="1060" y2="600" gradientUnits="userSpaceOnUse">
          <stop stop-color="${style.start}" />
          <stop offset="1" stop-color="${style.end}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="680" rx="34" fill="url(#serviceBg)" />
      <circle cx="1040" cy="120" r="150" fill="${style.accent}" fill-opacity="0.06" />
      <circle cx="1120" cy="582" r="190" fill="${style.accent}" fill-opacity="0.04" />
      <rect x="72" y="74" width="198" height="46" rx="23" fill="#ffffff" fill-opacity="0.9" />
      <text x="102" y="104" font-size="24" font-family="Arial, Helvetica, sans-serif" fill="${style.accent}" font-weight="700">PhysioOnClick</text>
      <rect x="72" y="146" width="236" height="40" rx="20" fill="${style.accent}" fill-opacity="0.1" />
      <text x="100" y="172" font-size="18" font-family="Arial, Helvetica, sans-serif" fill="${style.accent}" font-weight="700">${escapeXml(
        style.label
      )}</text>
      ${titleLines
        .map(
          (line, index) =>
            `<text x="72" y="${258 + index * 68}" font-size="54" font-family="Arial, Helvetica, sans-serif" fill="#142033" font-weight="800">${escapeXml(
              line
            )}</text>`
        )
        .join("")}
      <text x="72" y="488" font-size="26" font-family="Arial, Helvetica, sans-serif" fill="#546579">${escapeXml(summaryLine)}</text>
      <rect x="72" y="528" width="254" height="48" rx="24" fill="${style.accent}" fill-opacity="0.1" />
      <text x="102" y="559" font-size="22" font-family="Arial, Helvetica, sans-serif" fill="${style.accent}" font-weight="700">Glasgow clinic and online</text>
      <rect x="772" y="186" width="238" height="326" rx="42" fill="#ffffff" fill-opacity="0.78" />
      <circle cx="891" cy="252" r="54" fill="${style.accent}" fill-opacity="0.1" />
      ${motif}
    </svg>
  `;
}
