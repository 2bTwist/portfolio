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
