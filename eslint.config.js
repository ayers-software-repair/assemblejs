// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import js from "@eslint/js";
import globals from "globals";
import importX from "eslint-plugin-import-x";
import unicorn from "eslint-plugin-unicorn";
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
      // Implementing an interface routinely leaves a parameter unused; the underscore says the
      // omission is deliberate, so an unmarked unused name stays an error.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },

  // Organization rules 1 and 7, where an off-the-shelf rule exists. Rules 2, 3, 4 and 6 have no
  // equivalent and are enforced by scripts/check-organization.mjs over the AST.
  {
    files: ["packages/*/src/**/*.ts", "packages/*/test/**/*.ts"],
    plugins: { "import-x": importX, unicorn },
    settings: {
      // Point the resolver at each package's own tsconfig, whose `paths` map the published
      // specifier to src. Without it the resolver follows the exports map into dist, so lint
      // passed or failed depending on whether a build happened to be on disk.
      "import-x/resolver": {
        typescript: { alwaysTryTypes: true, project: ["packages/*/tsconfig.json"] },
      },
    },
    rules: {
      // Rule 1: the filename is the declaration, kebab-cased.
      "unicorn/filename-case": ["error", { case: "kebabCase" }],
      // Rule 7, as a warning shot well below the gate's hard ceiling of 300.
      "max-lines": ["error", { max: 300, skipBlankLines: false, skipComments: false }],
      // A cycle is the failure the whole leaf-import rule exists to prevent; this is the probe
      // that says so at the module graph rather than at the import line.
      "import-x/no-cycle": ["error", { maxDepth: Infinity }],
      "import-x/no-self-import": "error",
      // noUselessIndex is deliberately OFF: it rewrites "./compose/index.js" to "./compose",
      // which NodeNext does not resolve. Its autofix produced exactly that here and the
      // organization gate caught it. A rule whose fix breaks the runtime is worse than no rule.
      "import-x/no-useless-path-segments": ["error", { noUselessIndex: false }],
      // ESM on Node: a relative import without its extension does not resolve at runtime, and
      // the bundler hiding that in development is how it reaches production.
      // NodeNext resolves the specifier verbatim, so a relative import written without ".js"
      // typechecks and then fails at runtime. The rule requires what Node requires.
      "import-x/extensions": [
        "error",
        "ignorePackages",
        { js: "always", ts: "never", tsx: "never" },
      ],
      "import-x/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "never",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
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
