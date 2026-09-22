import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import perfectionist from "eslint-plugin-perfectionist";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import unicorn from "eslint-plugin-unicorn";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  // ── Global ignores ──────────────────────────────────────────
  globalIgnores(["dist", "coverage", "node_modules", "*.config.js", "src/api/schema.d.ts"]),

  // ── Base JS + TS with type information ──────────────────────
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // ── React ───────────────────────────────────────────────────
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
  },

  // ── Formatting: replaces Prettier (same settings as the API) ─
  stylistic.configs.customize({
    arrowParens: true,
    braceStyle: "1tbs",
    indent: 2,
    jsx: true,
    quotes: "double",
    semi: true,
  }),

  // ── Import ordering ─────────────────────────────────────────
  {
    plugins: { perfectionist },
    rules: {
      "perfectionist/sort-imports": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling", "index"],
            "type",
            "side-effect-style",
          ],
          newlinesBetween: 1,
          type: "natural",
        },
      ],
      "perfectionist/sort-named-exports": ["error", { type: "natural" }],
      "perfectionist/sort-named-imports": ["error", { type: "natural" }],
    },
  },

  // ── Unicorn: curated selection (same as the API) ────────────
  {
    plugins: { unicorn },
    rules: {
      "unicorn/catch-error-name": ["error", { name: "error" }],
      "unicorn/error-message": "error",
      "unicorn/no-for-each": "error",
      "unicorn/no-useless-promise-resolve-reject": "error",
      "unicorn/prefer-includes": "error",
      "unicorn/prefer-node-protocol": "error",
      "unicorn/prefer-string-starts-ends-with": "error",
      "unicorn/throw-new-error": "error",
    },
  },

  // ── Project rules ───────────────────────────────────────────
  {
    rules: {
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        // allow async handlers in JSX attributes (onClick={async () => ...})
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/return-await": ["error", "in-try-catch"],
      "eqeqeq": ["error", "smart"],
      "no-console": ["error", { allow: ["error"] }],
      "no-else-return": "error",
      "prefer-const": "error",
    },
  },

  // ── Tests: relaxed rules ────────────────────────────────────
  {
    files: ["src/**/*.test.{ts,tsx}", "src/testing/**"],
    rules: {
      "no-console": "off",
    },
  },
]);
