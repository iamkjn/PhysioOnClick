import type { BlogArticle } from "@/lib/blog";

const categoryStyles: Record<string, { start: string; end: string; accent: string }> = {
  "Back pain": { start: "#d6ebff", end: "#f3f9ff", accent: "#1773c7" },
  "Knee injuries": { start: "#dff3ea", end: "#f6fbf8", accent: "#198f68" },
  "Shoulder rehab": { start: "#e3efff", end: "#f8fbff", accent: "#316fd1" },
  Sciatica: { start: "#f3e6ff", end: "#fbf8ff", accent: "#7b4ac7" },
  "Sports injuries": { start: "#ffe8dc", end: "#fff7f1", accent: "#d96b24" },
  "Neurological conditions": { start: "#e2f4ff", end: "#f7fcff", accent: "#1682a8" },
  "Post-surgery recovery": { start: "#dff1ff", end: "#f8fbff", accent: "#1976d2" },
  "Home exercise advice": { start: "#e5f6ef", end: "#fbfefc", accent: "#1f8a5b" },
  "Workplace ergonomics": { start: "#edf1f7", end: "#fbfcfe", accent: "#4d6587" }
};

const categoryIcons: Record<string, string> = {
  "Back pain": "Back care",
  "Knee injuries": "Knee rehab",
  "Shoulder rehab": "Shoulder rehab",
  Sciatica: "Nerve care",
  "Sports injuries": "Sport recovery",
  "Neurological conditions": "Neuro physio",
  "Post-surgery recovery": "Post-op rehab",
  "Home exercise advice": "Home exercise",
  "Workplace ergonomics": "Ergonomic care"
};

const motifPatterns = [
  { x: 834, y: 192, width: 294, height: 294, radius: 40, rotation: -8 },
  { x: 850, y: 206, width: 272, height: 272, radius: 96, rotation: 0 },
  { x: 818, y: 214, width: 308, height: 256, radius: 32, rotation: 6 },
  { x: 840, y: 198, width: 286, height: 286, radius: 58, rotation: -14 }
];

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function generateBlogCoverSvg(article: BlogArticle) {
  const style = categoryStyles[article.category] || categoryStyles["Back pain"];
  const motif = motifPatterns[article.slug.length % motifPatterns.length];
  const iconLabel = categoryIcons[article.category] || "Physio guide";
  const lineArt =
    article.category === "Back pain"
      ? `<path d="M967 252C931 284 922 327 944 365C959 391 956 423 939 451" stroke="${style.accent}" stroke-width="18" stroke-linecap="round" stroke-opacity="0.33"/>`
      : article.category === "Knee injuries"
        ? `<path d="M951 252C930 283 932 332 954 354C970 370 968 406 953 438" stroke="${style.accent}" stroke-width="18" stroke-linecap="round" stroke-opacity="0.33"/><path d="M997 256C1014 285 1015 325 995 353C979 376 980 412 997 439" stroke="${style.accent}" stroke-width="18" stroke-linecap="round" stroke-opacity="0.33"/>`
        : article.category === "Shoulder rehab"
          ? `<path d="M929 314C952 278 1010 276 1034 312C1048 334 1046 364 1028 382C1007 403 972 405 949 387C926 369 912 339 929 314Z" stroke="${style.accent}" stroke-width="16" stroke-opacity="0.33" fill="none"/>`
          : article.category === "Sciatica"
            ? `<path d="M966 258C935 298 937 345 961 374C978 394 980 424 968 453" stroke="${style.accent}" stroke-width="16" stroke-linecap="round" stroke-opacity="0.33"/><circle cx="967" cy="451" r="12" fill="${style.accent}" fill-opacity="0.28"/>`
            : article.category === "Sports injuries"
              ? `<path d="M934 368L968 274L999 334L1036 244" stroke="${style.accent}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.33"/>`
              : article.category === "Neurological conditions"
                ? `<path d="M936 301C936 273 958 252 986 252C1014 252 1036 273 1036 301C1036 315 1030 327 1021 336C1006 352 1004 376 1015 396C1021 407 1024 418 1024 430C1024 454 1005 474 981 474C957 474 938 454 938 430C938 418 942 406 949 395C962 375 961 353 947 337C940 329 936 316 936 301Z" stroke="${style.accent}" stroke-width="15" stroke-opacity="0.33" fill="none"/>`
                : article.category === "Post-surgery recovery"
                  ? `<path d="M928 318H1044M928 352H1044M952 284H1020" stroke="${style.accent}" stroke-width="18" stroke-linecap="round" stroke-opacity="0.33"/>`
                  : article.category === "Home exercise advice"
                    ? `<path d="M935 404L969 302L997 348L1034 274" stroke="${style.accent}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.33"/><path d="M956 440H1020" stroke="${style.accent}" stroke-width="18" stroke-linecap="round" stroke-opacity="0.2"/>`
                    : `<path d="M938 420V294H1035V420" stroke="${style.accent}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.33"/><path d="M964 332H1010M964 366H1010" stroke="${style.accent}" stroke-width="16" stroke-linecap="round" stroke-opacity="0.24"/>`;

  return `
    <svg width="1200" height="680" viewBox="0 0 1200 680" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="120" y1="90" x2="1080" y2="620" gradientUnits="userSpaceOnUse">
          <stop stop-color="${style.start}" />
          <stop offset="1" stop-color="${style.end}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="680" rx="36" fill="url(#bg)" />
      <circle cx="980" cy="122" r="140" fill="${style.accent}" fill-opacity="0.08" />
      <circle cx="1080" cy="590" r="180" fill="${style.accent}" fill-opacity="0.06" />
      <rect x="72" y="68" width="248" height="54" rx="27" fill="#ffffff" fill-opacity="0.88" />
      <text x="104" y="102" font-size="28" font-family="Arial, Helvetica, sans-serif" fill="${style.accent}" font-weight="700">PhysioOnClick</text>
      <rect x="72" y="170" width="280" height="48" rx="24" fill="${style.accent}" fill-opacity="0.12" />
      <text x="102" y="201" font-size="26" font-family="Arial, Helvetica, sans-serif" fill="${style.accent}" font-weight="700">${escapeXml(article.category)}</text>
      <text x="72" y="152" font-size="18" font-family="Arial, Helvetica, sans-serif" fill="#607086" font-weight="700">${escapeXml(
        iconLabel
      )}</text>
      <text x="72" y="292" font-size="28" font-family="Arial, Helvetica, sans-serif" fill="#546579">Evidence-based UK physiotherapy guidance</text>
      <g transform="rotate(${motif.rotation} 980 340)">
        <rect x="${motif.x}" y="${motif.y}" width="${motif.width}" height="${motif.height}" rx="${motif.radius}" fill="#ffffff" fill-opacity="0.76" />
      </g>
      <circle cx="980" cy="286" r="58" fill="${style.accent}" fill-opacity="0.12" />
      ${lineArt}
    </svg>
  `;
}
