import { NextResponse } from "next/server";

const specialisms = {
  "msk-physiotherapy": {
    title: "MSK Physiotherapy",
    label: "Pain & movement",
    accent: "#0d81aa",
    pale: "#dff3fb",
    motif: `
      <circle cx="908" cy="236" r="44" fill="#ffffff" stroke="#0d81aa" stroke-width="16" stroke-opacity="0.3"/>
      <path d="M908 286V384M846 326L908 352L970 326M866 506L908 384L950 506" stroke="#0d81aa" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.28"/>
      <path d="M794 458C836 426 870 426 908 458C946 490 984 490 1026 458" stroke="#0d81aa" stroke-width="15" stroke-linecap="round" stroke-opacity="0.24"/>
      <rect x="796" y="520" width="228" height="18" rx="9" fill="#0d81aa" fill-opacity="0.14"/>
    `
  },
  "arthroplasty-rehabilitation": {
    title: "Arthroplasty Rehabilitation",
    label: "Orthopaedic recovery",
    accent: "#2378c7",
    pale: "#dcecff",
    motif: `
      <path d="M824 420C856 350 876 306 884 248" stroke="#2378c7" stroke-width="24" stroke-linecap="round" stroke-opacity="0.32"/>
      <path d="M944 420C912 350 892 306 884 248" stroke="#2378c7" stroke-width="24" stroke-linecap="round" stroke-opacity="0.32"/>
      <circle cx="884" cy="250" r="54" fill="#ffffff" stroke="#2378c7" stroke-width="18" stroke-opacity="0.34"/>
      <path d="M774 420H994" stroke="#2378c7" stroke-width="18" stroke-linecap="round" stroke-opacity="0.22"/>
      <path d="M805 470H963M832 510H936" stroke="#2378c7" stroke-width="14" stroke-linecap="round" stroke-opacity="0.24"/>
    `
  },
  "neurological-rehabilitation": {
    title: "Neurological Rehabilitation",
    label: "Neuro physio",
    accent: "#1085a8",
    pale: "#e4f7ff",
    motif: `
      <path d="M850 284C850 236 888 198 936 198C984 198 1022 236 1022 284C1022 314 1006 340 982 356C958 372 952 406 970 430C982 446 988 464 988 484C988 524 956 556 916 556C876 556 844 524 844 484C844 462 852 442 866 426C884 404 878 374 856 356C834 338 820 312 820 284C820 246 850 214 888 210" stroke="#1085a8" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.34" fill="none"/>
      <path d="M908 270H976M898 324H990M884 378H968" stroke="#1085a8" stroke-width="13" stroke-linecap="round" stroke-opacity="0.24"/>
      <circle cx="936" cy="198" r="12" fill="#1085a8" fill-opacity="0.24"/>
      <circle cx="1022" cy="284" r="12" fill="#1085a8" fill-opacity="0.24"/>
      <circle cx="916" cy="556" r="12" fill="#1085a8" fill-opacity="0.24"/>
    `
  },
  "paediatric-physiotherapy": {
    title: "Paediatric Physiotherapy",
    label: "Child-centred support",
    accent: "#228b62",
    pale: "#e5f6ef",
    motif: `
      <circle cx="902" cy="236" r="42" fill="#ffffff" stroke="#228b62" stroke-width="16" stroke-opacity="0.34"/>
      <path d="M902 286V392M838 330L902 356L966 330M872 506L902 392L932 506" stroke="#228b62" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.32"/>
      <circle cx="808" cy="474" r="34" fill="#228b62" fill-opacity="0.16"/>
      <circle cx="1000" cy="474" r="34" fill="#228b62" fill-opacity="0.16"/>
      <path d="M782 536C820 506 856 506 894 536M918 536C956 506 992 506 1030 536" stroke="#228b62" stroke-width="13" stroke-linecap="round" stroke-opacity="0.24"/>
    `
  },
  "sports-tendon-rehabilitation": {
    title: "Sports & Tendon Rehabilitation",
    titleLines: ["Sports & Tendon", "Rehabilitation"],
    label: "Active recovery",
    accent: "#d96b24",
    pale: "#ffe8dc",
    motif: `
      <path d="M804 476L854 328L902 410L984 248" stroke="#d96b24" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.3"/>
      <circle cx="854" cy="328" r="18" fill="#d96b24" fill-opacity="0.24"/>
      <circle cx="902" cy="410" r="18" fill="#d96b24" fill-opacity="0.24"/>
      <circle cx="984" cy="248" r="18" fill="#d96b24" fill-opacity="0.24"/>
      <path d="M798 532H1032M828 280H888M946 474H1012" stroke="#d96b24" stroke-width="15" stroke-linecap="round" stroke-opacity="0.2"/>
      <path d="M1012 248L1038 248L1038 274" stroke="#d96b24" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.28"/>
    `
  },
  "research-and-innovation": {
    title: "Research & Innovation",
    label: "Technology-led rehab",
    accent: "#7250c6",
    pale: "#efe9ff",
    motif: `
      <rect x="810" y="220" width="220" height="276" rx="34" fill="#ffffff" stroke="#7250c6" stroke-width="14" stroke-opacity="0.22"/>
      <path d="M854 322H986M854 376H956M854 430H986" stroke="#7250c6" stroke-width="14" stroke-linecap="round" stroke-opacity="0.26"/>
      <path d="M806 534C866 496 930 496 990 534" stroke="#7250c6" stroke-width="16" stroke-linecap="round" stroke-opacity="0.22"/>
      <circle cx="884" cy="260" r="16" fill="#7250c6" fill-opacity="0.24"/>
      <circle cx="930" cy="260" r="16" fill="#7250c6" fill-opacity="0.16"/>
      <circle cx="976" cy="260" r="16" fill="#7250c6" fill-opacity="0.24"/>
    `
  }
} as const;

const PAPER = "#F6F3EC";
const INK = "#043246";
const SKY = "#0EA5E9";
const MUTED = "#5B6B72";
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'DM Sans', Arial, Helvetica, sans-serif";

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

  const titleLines = "titleLines" in item
    ? item.titleLines
    : [item.title.split(" ")[0], item.title.split(" ").slice(1).join(" ")].filter(Boolean);

  const svg = `
    <svg width="1200" height="680" viewBox="0 0 1200 680" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="aboutBg" x1="110" y1="80" x2="1080" y2="620" gradientUnits="userSpaceOnUse">
          <stop stop-color="${item.pale}" />
          <stop offset="1" stop-color="${PAPER}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="680" rx="36" fill="url(#aboutBg)" />
      <rect width="1200" height="10" fill="${SKY}" />
      <circle cx="1120" cy="116" r="190" fill="${item.accent}" fill-opacity="0.06" />
      <circle cx="1064" cy="612" r="230" fill="${item.accent}" fill-opacity="0.05" />
      <rect x="72" y="64" width="52" height="52" rx="14" fill="${SKY}" />
      <text x="98" y="101" text-anchor="middle" font-size="32" font-family="${SANS}" fill="#ffffff" font-weight="700">P</text>
      <text x="140" y="99" font-size="27" font-family="${SANS}" fill="${INK}" font-weight="700">PhysioOnClick</text>
      <rect x="72" y="186" width="104" height="8" rx="4" fill="${SKY}" />
      <rect x="72" y="232" width="330" height="50" rx="25" fill="${item.accent}" fill-opacity="0.12" />
      <text x="102" y="264" font-size="24" font-family="${SANS}" fill="${item.accent}" font-weight="700">${escapeXml(
        item.label
      )}</text>
      ${titleLines
        .slice(0, 2)
        .map(
          (line, index) =>
            `<text x="72" y="${374 + index * 74}" font-size="62" font-family="${SERIF}" fill="${INK}" font-weight="700">${escapeXml(
              line,
            )}</text>`,
        )
        .join("")}
      <rect x="72" y="508" width="284" height="48" rx="24" fill="#ffffff" fill-opacity="0.72" />
      <text x="102" y="539" font-size="23" font-family="${SANS}" fill="${MUTED}" font-weight="700">Clinical focus area</text>
      <rect x="748" y="150" width="380" height="424" rx="56" fill="#ffffff" fill-opacity="0.72" />
      <rect x="778" y="180" width="320" height="364" rx="44" fill="#ffffff" fill-opacity="0.7" stroke="${item.accent}" stroke-width="2" stroke-opacity="0.14" />
      ${item.motif}
    </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400"
    }
  });
}
