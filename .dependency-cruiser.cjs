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
        "Browser code may reach the shared WIRE SHAPES and nothing else: src/json for what " +
        "JSON is, src/island for the payload that actually crosses the boundary. Both are " +
        "types with no behaviour, which is why both sides may hold them. Anything else " +
        "server-side that browser code imports is something a bundler would have to strip, " +
        "and stripping is what leaks a secret when it fails.",
      from: { path: "^packages/[^/]+/src/client/" },
      to: {
        path: "^packages/[^/]+/src/",
        pathNot: [
          "^packages/[^/]+/src/client/",
          "^packages/[^/]+/src/json/",
          "^packages/[^/]+/src/island/",
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
