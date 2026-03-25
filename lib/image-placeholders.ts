function toBase64(value: string) {
  return Buffer.from(value).toString("base64");
}

function svgToDataUrl(svg: string) {
  return `data:image/svg+xml;base64,${toBase64(svg)}`;
}

export const medicalImagePlaceholder = svgToDataUrl(`
  <svg width="1200" height="680" viewBox="0 0 1200 680" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="680" rx="36" fill="#e8f1fa" />
    <circle cx="968" cy="120" r="144" fill="#1f78c8" fill-opacity="0.08" />
    <circle cx="1102" cy="590" r="180" fill="#1f78c8" fill-opacity="0.06" />
    <rect x="74" y="84" width="214" height="46" rx="23" fill="#ffffff" fill-opacity="0.86" />
    <rect x="74" y="178" width="388" height="30" rx="15" fill="#d2e3f3" />
    <rect x="74" y="228" width="518" height="30" rx="15" fill="#dbe8f5" />
    <rect x="74" y="278" width="470" height="30" rx="15" fill="#d2e3f3" />
    <rect x="74" y="350" width="560" height="18" rx="9" fill="#e0ebf6" />
    <rect x="74" y="386" width="520" height="18" rx="9" fill="#e0ebf6" />
    <rect x="74" y="468" width="180" height="56" rx="28" fill="#1f78c8" fill-opacity="0.18" />
    <rect x="274" y="468" width="200" height="56" rx="28" fill="#ffffff" fill-opacity="0.5" />
    <rect x="842" y="194" width="278" height="278" rx="40" fill="#ffffff" fill-opacity="0.66" />
    <circle cx="981" cy="312" r="56" fill="#1f78c8" fill-opacity="0.14" />
    <rect x="884" y="508" width="194" height="46" rx="23" fill="#1f78c8" fill-opacity="0.12" />
  </svg>
`);
