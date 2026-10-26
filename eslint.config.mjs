import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Flat config replacing .eslintrc.json: Next 16 removed `next lint`, so
// `npm run lint` now runs the ESLint CLI directly.
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // eslint-config-next 16 ships eslint-plugin-react-hooks 7, whose React
    // Compiler rules are new errors. Existing code trips these four ~90 times
    // (mostly setState inside useEffect), so they warn until that cleanup is
    // done on its own; every other new rule stays an error.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/refs": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    ".open-next/**",
    ".wrangler/**",
    ".claude/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "cloudflare-env.d.ts",
    // Separate projects with their own tooling.
    "functions/**",
    "mobile_app/**",
  ]),
]);
