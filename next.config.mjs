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
