import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Next's optimizer needs sharp, which does not run on the Cloudflare
    // Workers runtime. Every image here is an SVG (local /*-images routes and
    // static files), and Next passes SVGs through unoptimized regardless — so
    // this costs nothing today and avoids needing the paid Images binding.
    // Serving raster images at scale later? Wire up Cloudflare Images and drop
    // this flag.
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      }
    ],
    // lib/site-data.ts and lib/blog.ts append `?v=2` to local cover-image
    // URLs as a cache-buster; app/specialism-images serves without a query
    // string. Next.js 15 warns on local image srcs with query params it
    // hasn't been told to allow, and Next 16 makes this a hard requirement.
    localPatterns: [
      { pathname: "/service-images/**", search: "?v=3" },
      { pathname: "/blog-images/**", search: "?v=2" },
      { pathname: "/specialism-images/**", search: "" }
    ]
  },
  experimental: {
    viewTransition: true,
  },
  // Strips `x-powered-by: Next.js` — no reason to advertise the framework
  // to anyone probing the live site.
  poweredByHeader: false,
  // OpenNext's Cloudflare adapter runs the real compiled Next.js request
  // handler inside the Worker (not a static translation the way
  // next-on-pages worked), so next.config.mjs headers()/redirects() are
  // honoured exactly as documented — verified below against `npm run
  // preview`, which runs the actual workerd runtime locally.
  async headers() {
    return [
      // --- Security headers (every route) ---------------------------------
      {
        source: "/:path*",
        headers: [
          // HSTS without `preload`: that flag is a one-way submission to
          // browsers' built-in preload lists and the owner hasn't opted in.
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Deny-by-default Permissions-Policy. Camera is re-enabled only
          // for /patient/:path* below, where components/motion-check.tsx
          // and components/face-motion-check.tsx call
          // getUserMedia({ video: ... }) for the pose/face motion-grading
          // feature (rendered from app/patient/assessment, .../recovery,
          // .../exercises). Nothing in the app uses microphone, geolocation,
          // USB, or MIDI. `payment=(self)` is left enabled everywhere:
          // Stripe Checkout is a top-level redirect to checkout.stripe.com
          // (see booking-step-time.tsx), not an embedded Payment Request
          // API iframe, so it isn't strictly needed — but disabling it
          // risks breaking payment and buys nothing, so it stays open.
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), usb=(), midi=(), payment=(self)",
          },
        ],
      },
      {
        // Re-enable camera for the patient portal only (see above).
        source: "/patient/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value:
              "camera=(self), microphone=(), geolocation=(), usb=(), midi=(), payment=(self)",
          },
        ],
      },
      // Deliberately deferred: no Content-Security-Policy in this pass.
      // This app loads Stripe, Firebase, Google Fonts and Cal.com from
      // multiple origins; a wrong CSP silently breaks checkout. Needs its
      // own pass with a real allow-list and testing against a live payment.

      // --- Caching ---------------------------------------------------------
      // Static marketing pages: cacheable at the edge (s-maxage) but not
      // stored by the visitor's own browser (max-age=0), so a redeploy is
      // visible immediately while the Worker stops re-rendering on every
      // hit. Every route listed here is prerendered at build time, so the
      // HTML is byte-identical for every visitor.
      //
      // "/" is deliberately NOT in this list. app/page.tsx reads the
      // `poc-auth` cookie to decide whether to render the marketing hero or
      // a signed-in dashboard loader, which makes it a dynamic, per-visitor
      // response. Caching it publicly at the edge would let one visitor's
      // variant be served to everyone else — the signed-in loader shown to
      // logged-out visitors, or the marketing hero flashed at returning
      // patients, which is the exact thing the cookie exists to prevent.
      // `Vary: Cookie` is not a fix here: Cloudflare does not vary the
      // edge cache on arbitrary cookies for HTML.
      ...[
        "/about",
        "/services",
        "/pricing",
        "/book",
        "/blog",
        "/blog/:slug*",
        "/glasgow-physiotherapist",
        "/professional-standards",
        "/contact",
        "/cancellation-policy",
        "/privacy-policy",
        "/terms",
        "/medical-disclaimer",
      ].map((source) => ({
        source,
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      })),
      // Patient health data, admin, API responses, auth, and payment
      // receipts must never be cached or shared. This duplicates Next's own
      // default for dynamic routes, but is stated explicitly on purpose:
      // getting this wrong is a data leak, and the public "/book" rule
      // above only matches the exact booking-flow entry page, not
      // /book/receipt/* or /book/success.
      {
        source: "/patient/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/auth/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/book/receipt/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      // Static-asset inconsistency noted but NOT fixed here:
      // /home-hero-premium.svg is served `public, max-age=0,
      // must-revalidate` while /blog-images/*, /service-images/*, and
      // /specialism-images/* correctly send `immutable, max-age=31536000`
      // — but they do that themselves, in their own route.ts handlers
      // (app/blog-images/[slug]/route.ts etc.), not via next.config.mjs, so
      // there's nothing to touch here for them. /home-hero-premium.svg
      // lives under /public and is served by Cloudflare's static-asset
      // handler in front of the Worker (OpenNext's `assets` binding), not
      // by Next's request handler at all — so a next.config.mjs headers()
      // rule for it would never even run. Fixing it needs a wrangler.jsonc
      // `assets` header rule (or an `_headers` file), which is out of scope
      // for this file.
    ];
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // The Firebase *client* SDK ships two builds. Its "node" build talks gRPC
      // via protobufjs, which generates code with new Function() at import time —
      // workerd forbids that ("Code generation from strings disallowed"), so every
      // SSR'd page 500s. Its browser build is WebChannel-over-fetch and runs fine.
      //
      // lib/firebase.ts reaches the server bundle via lib/firestore-content.ts and
      // SSR'd client components, so the gRPC build has to be kept out.
      //
      // This is an alias rather than a conditionNames change on purpose: export
      // conditions are matched in the package.json's own key order, and
      // @firebase/firestore lists "node" before "browser" — so the only way to
      // win via conditions is to drop "node" for the whole server bundle, which
      // also strips Next's "react-server" condition and breaks RSC resolution.
      // Both wrapper entrypoints ultimately `export * from "@firebase/firestore"`,
      // so redirecting this one package covers every import path.
      config.resolve.alias = {
        ...config.resolve.alias,
        "@firebase/firestore$": path.resolve(
          process.cwd(),
          "node_modules/@firebase/firestore/dist/index.esm2017.js",
        ),
      };
    }
    return config;
  },
};

export default nextConfig;
