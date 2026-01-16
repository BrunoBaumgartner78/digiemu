// eslint.config.mjs (oder eslint.config.ts, je nach Setup)
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks";

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  // react-hooks plugin korrekt registrieren (für set-state-in-effect etc.)
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // optional: weniger streng (nur Warnungen)
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },

  // Mach "any" projectweit zu WARNING (damit lint nicht bricht)
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  // Allow require() in scripts + *.cjs
  {
    files: ["**/*.cjs", "scripts/**/*.cjs"],
    languageOptions: { sourceType: "commonjs" },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);
