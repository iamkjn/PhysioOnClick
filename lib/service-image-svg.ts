import type { Service } from "@/lib/site-data";

const serviceStyles: Record<string, { start: string; end: string; accent: string }> = {
  "musculoskeletal-physiotherapy": {
    start: "#dcecff",
    end: "#f7fbff",
    accent: "#1d79c8"
  },
  "post-surgical-rehabilitation": {
    start: "#e2f1ff",
    end: "#f9fcff",
    accent: "#2372c4"
  },
  "neurological-rehabilitation": {
    start: "#e4f7ff",
    end: "#fbfeff",
    accent: "#1186a8"
  },
  "paediatric-physiotherapy": {
    start: "#e6f7ef",
    end: "#fbfefc",
    accent: "#238a61"
  },
  "gait-and-mobility-assessment": {
    start: "#eef3fb",
    end: "#fbfdff",
    accent: "#4d6f98"
  },
  "online-rehab-programmes": {
    start: "#efe9ff",
    end: "#fbf9ff",
    accent: "#7250c6"
  }
};

/**
 * Each service gets its own icon composition, not a recolored template —
 * the old version only swapped a thin corner squiggle per service on an
 * otherwise identical card. Every icon below is centered on the white
 * panel's (891, 349) midpoint and stays within its ±~120px bounds.
 */
function serviceIcon(slug: string, accent: string): string {
  switch (slug) {
    case "musculoskeletal-physiotherapy":
      // Two bone segments meeting at a joint, with a flexion arc.
      return `
        <g transform="translate(891,349)">
          <g transform="rotate(-18)"><rect x="-15" y="-104" width="30" height="92" rx="15" fill="${accent}" fill-opacity="0.82"/></g>
          <g transform="rotate(38)"><rect x="-15" y="10" width="30" height="92" rx="15" fill="${accent}" fill-opacity="0.5"/></g>
          <path d="M-58 -34A80 80 0 0 1 34 52" stroke="${accent}" stroke-width="5" stroke-dasharray="2 11" stroke-linecap="round" fill="none" opacity="0.45"/>
          <circle r="21" fill="${accent}"/>
          <circle r="21" fill="none" stroke="#ffffff" stroke-width="4"/>
        </g>
      `;
    case "post-surgical-rehabilitation":
      // An adhesive bandage/plaster with a perforated pad, plus a healing stitch-line.
      return `
        <g transform="translate(891,349) rotate(-22)">
          <rect x="-92" y="-27" width="184" height="54" rx="27" fill="${accent}" fill-opacity="0.85"/>
          <rect x="-35" y="-18" width="70" height="36" rx="10" fill="#ffffff" fill-opacity="0.92"/>
          <circle cx="-14" cy="-7" r="2.6" fill="${accent}"/>
          <circle cx="0" cy="-7" r="2.6" fill="${accent}"/>
          <circle cx="14" cy="-7" r="2.6" fill="${accent}"/>
          <circle cx="-14" cy="7" r="2.6" fill="${accent}"/>
          <circle cx="0" cy="7" r="2.6" fill="${accent}"/>
          <circle cx="14" cy="7" r="2.6" fill="${accent}"/>
        </g>
        <path d="M818 424C860 446 922 446 964 424" stroke="${accent}" stroke-width="5" stroke-dasharray="3 9" stroke-linecap="round" fill="none" opacity="0.4"/>
      `;
    case "neurological-rehabilitation":
      // A brain outline with radiating nerve-pathway nodes.
      return `
        <g transform="translate(891,332)">
          <path d="M-58 -8C-58 -45 -30 -66 0 -66C30 -66 58 -45 58 -8C58 12 47 25 47 45C47 63 32 77 10 77C6 77 2 75 0 73C-2 75 -6 77 -10 77C-32 77 -47 63 -47 45C-47 25 -58 12 -58 -8Z" fill="${accent}" fill-opacity="0.85"/>
          <path d="M0 -60V72" stroke="#ffffff" stroke-width="4" stroke-opacity="0.45"/>
          <path d="M-96 12L-58 6" stroke="${accent}" stroke-width="3" opacity="0.55"/>
          <circle cx="-96" cy="12" r="7" fill="${accent}"/>
          <path d="M-118 -26L-96 12" stroke="${accent}" stroke-width="3" opacity="0.4"/>
          <circle cx="-118" cy="-26" r="5.5" fill="${accent}" opacity="0.7"/>
          <path d="M96 32L53 26" stroke="${accent}" stroke-width="3" opacity="0.55"/>
          <circle cx="96" cy="32" r="7" fill="${accent}"/>
          <path d="M114 70L96 32" stroke="${accent}" stroke-width="3" opacity="0.4"/>
          <circle cx="114" cy="70" r="5.5" fill="${accent}" opacity="0.7"/>
        </g>
      `;
    case "paediatric-physiotherapy":
      // A small, playful hopping figure with a sparkle — child scale, not clinical-adult scale.
      return `
        <g transform="translate(891,372)">
          <circle cy="-72" r="27" fill="${accent}" fill-opacity="0.9"/>
          <path d="M-20 -22C-20 -39 -9 -50 0 -50C9 -50 20 -39 20 -22V16C20 27 11 36 0 36C-11 36 -20 27 -20 16V-22Z" fill="${accent}" fill-opacity="0.62"/>
          <path d="M-18 -24C-34 -33 -43 -30 -49 -17" stroke="${accent}" stroke-width="11" stroke-linecap="round" fill="none" opacity="0.62"/>
          <path d="M18 -24C34 -33 43 -30 49 -17" stroke="${accent}" stroke-width="11" stroke-linecap="round" fill="none" opacity="0.62"/>
          <path d="M-9 34C-14 48 -12 57 -19 66" stroke="${accent}" stroke-width="11" stroke-linecap="round" fill="none" opacity="0.5"/>
          <path d="M9 34C14 48 12 57 19 66" stroke="${accent}" stroke-width="11" stroke-linecap="round" fill="none" opacity="0.5"/>
          <path d="M62 -92L66 -80L78 -76L66 -72L62 -60L58 -72L46 -76L58 -80Z" fill="${accent}" opacity="0.5"/>
        </g>
      `;
    case "gait-and-mobility-assessment":
      // Footprints receding along a dashed walking line.
      return `
        <g transform="translate(891,349)">
          <path d="M-72 92C-32 42 18 -8 58 -82" stroke="${accent}" stroke-width="3" stroke-dasharray="2 11" stroke-linecap="round" fill="none" opacity="0.32"/>
          <ellipse cx="-62" cy="72" rx="15" ry="25" fill="${accent}" opacity="0.85" transform="rotate(-12 -62 72)"/>
          <ellipse cx="-32" cy="22" rx="14" ry="23" fill="${accent}" opacity="0.68" transform="rotate(10 -32 22)"/>
          <ellipse cx="4" cy="-22" rx="14" ry="23" fill="${accent}" opacity="0.52" transform="rotate(-10 4 -22)"/>
          <ellipse cx="38" cy="-66" rx="13" ry="21" fill="${accent}" opacity="0.36" transform="rotate(10 38 -66)"/>
        </g>
      `;
    case "online-rehab-programmes":
      // A screen with a vitals waveform and signal dots — remote/tele-rehab.
      return `
        <g transform="translate(891,349)">
          <rect x="-74" y="-58" width="148" height="102" rx="20" fill="${accent}" fill-opacity="0.85"/>
          <rect x="-58" y="-44" width="116" height="74" rx="9" fill="#ffffff" fill-opacity="0.94"/>
          <path d="M-42 0H-20L-10 -24L4 20L16 -8L36 -8" stroke="${accent}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <rect x="-17" y="52" width="34" height="10" rx="5" fill="${accent}" fill-opacity="0.85"/>
          <circle cx="48" cy="-72" r="6" fill="${accent}" opacity="0.5"/>
          <circle cx="61" cy="-87" r="5" fill="${accent}" opacity="0.35"/>
          <path d="M42 -68C48 -76 56 -80 64 -82" stroke="${accent}" stroke-width="3" fill="none" opacity="0.4"/>
        </g>
      `;
    default:
      return "";
  }
}

export function generateServiceCoverSvg(service: Service) {
  const style = serviceStyles[service.slug] || serviceStyles["musculoskeletal-physiotherapy"];
  const icon = serviceIcon(service.slug, style.accent) || serviceIcon("musculoskeletal-physiotherapy", style.accent);

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
      <rect x="772" y="186" width="238" height="326" rx="42" fill="#ffffff" fill-opacity="0.78" />
      <circle cx="891" cy="349" r="118" fill="${style.accent}" fill-opacity="0.07" />
      ${icon}
    </svg>
  `;
}
