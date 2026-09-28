import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Stricter React Compiler health: exhaustive-deps as an error catches the
  // missing deps that silently defeat auto-memoization. The react-hooks plugin
  // is already registered by eslint-config-next, so we only raise the rule.
  {
    rules: {
      "react-hooks/exhaustive-deps": "error",
    },
  },
  // Browser storage goes through app/lib/preferences.ts, so every saved key is
  // declared, validated, and tested in one place (AGENTS.md, preference contract).
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    ignores: ["app/lib/preferences.ts", "**/*.test.*"],
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "localStorage", message: "Declare a preference in app/lib/preferences.ts instead." },
        { name: "sessionStorage", message: "Declare a preference in app/lib/preferences.ts instead." },
      ],
      "no-restricted-properties": [
        "error",
        { object: "window", property: "localStorage", message: "Declare a preference in app/lib/preferences.ts instead." },
        { object: "window", property: "sessionStorage", message: "Declare a preference in app/lib/preferences.ts instead." },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // CommonJS tool configs (lhci / size-limit expect module.exports + require).
    "lighthouserc.js",
    ".size-limit.js",
  ]),
]);

export default eslintConfig;
