// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/dist/**", "**/node_modules/**", "coverage/**", "scripts/fixtures/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  // Repository tooling prints to stdout on purpose: its output is the gate's evidence.
  { files: ["scripts/**", "eslint.config.js"], rules: { "no-console": "off" } },
  // Browser code declares its own globals; a package opts in per directory as it is written.
  {
    files: ["packages/*/src/client/**", "packages/*/src/**/*.client.ts"],
    languageOptions: { globals: { ...globals.browser } },
  },
);
