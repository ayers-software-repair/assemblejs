// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// The module graph's own rules. eslint sees one file at a time; this sees the shape.
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment:
        "A cycle is what organization rule 4 exists to prevent. The rule is checked at the " +
        "import line; this is the same claim checked at the graph, where a cycle through three " +
        "files is still visible.",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-orphans",
      severity: "error",
      comment:
        "A module nothing imports and that imports nothing is dead. knip finds unused exports; " +
        "this finds an entire file that fell out of the graph.",
      from: {
        orphan: true,
        pathNot: [
          "(^|/)index\\.ts$",
          "\\.d\\.ts$",
          // A test file is an entry point by definition: the runner imports it, no module does.
          "\\.test\\.ts$",
          // So is a tool's own config: the tool loads it, no module imports it.
          "(^|/)(tsup|vitest|eslint|prettier)\\.config\\.[cm]?[jt]s$",
          "(^|/)[.][^/]+[.](js|cjs|mjs|ts)$",
        ],
      },
      to: {},
    },
    {
      name: "not-to-unresolvable",
      severity: "error",
      comment: "An import that does not resolve is a runtime failure that typechecked.",
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: "no-bundler-at-runtime",
      severity: "error",
      comment:
        "The design's runtime rule: a built server starts under plain node with no bundler " +
        "present. The predecessor could not, because its core imported its dev server's " +
        "transform. This refuses the first import that would bring one back.",
      from: { path: "^packages/core/src" },
      to: { path: "node_modules/(vite|vavite|rollup|webpack|@vitejs|esbuild)" },
    },
    {
      name: "client-stays-browser-only",
      severity: "error",
      comment:
        "Browser code may reach the SHARED VOCABULARY AND WIRE SHAPES and nothing else: " +
        "src/json for what JSON is, src/island for the payload that crosses the boundary, and " +
        "src/vocab for the words themselves. All three hold names and types with no behaviour, " +
        "and the vocabulary is shared by definition: the server spells the envelope element to " +
        "emit it and the browser spells the same one to find it, which is the entire reason " +
        "those words live in one module. Anything else server-side that browser code imports " +
        "is something a bundler would have to strip, and stripping is what leaks a secret when " +
        "it fails.",
      from: { path: "^packages/[^/]+/src/client/" },
      to: {
        path: "^packages/[^/]+/src/",
        pathNot: [
          "^packages/[^/]+/src/client/",
          "^packages/[^/]+/src/json/",
          "^packages/[^/]+/src/island/",
          "^packages/[^/]+/src/vocab/",
          // A renderer's props contract, which both halves agree on: the server renders with
          // them and the browser mounts with them. Fourth and last of the shared-shape
          // directories, and the rule is the same one each time: a directory holding types and
          // no behaviour is owned by both sides, and everything else is not.
          "^packages/[^/]+/src/props/",
        ],
      },
    },
    {
      name: "no-node-builtins-in-client",
      severity: "error",
      comment: "A node builtin in browser code is a build that only fails at run time.",
      from: { path: "^packages/[^/]+/src/client/" },
      to: { dependencyTypes: ["core"] },
    },
  ],
  options: {
    // dist is build output: it is a copy of the graph, not part of it, and cruising it reports
    // every built entry point as an orphan.
    exclude: { path: "(^|/)(dist|coverage|node_modules)/" },
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.base.json" },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: { exportsFields: ["exports"], conditionNames: ["import", "types"] },
    reporterOptions: { text: { highlightFocused: true } },
  },
};
