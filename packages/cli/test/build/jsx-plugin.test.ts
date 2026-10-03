// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "esbuild";
import { describe, expect, it } from "vitest";
import { jsxPlugin } from "@assemblejs/cli";

describe("compiling each JSX file through its own framework's runtime", () => {
  it("builds a React and a Preact view side by side, each against its own runtime", async () => {
    const root = mkdtempSync(join(tmpdir(), "jsx-"));
    for (const name of ["a", "b"]) mkdirSync(join(root, name));
    writeFileSync(join(root, "a", "a.react.tsx"), "export default () => <p>react</p>;");
    writeFileSync(join(root, "b", "b.preact.tsx"), "export default () => <p>preact</p>;");
    writeFileSync(join(root, "entry.ts"), 'import "./a/a.react.tsx";\nimport "./b/b.preact.tsx";');
    const result = await build({
      entryPoints: [join(root, "entry.ts")],
      bundle: true,
      write: false,
      jsx: "automatic",
      format: "esm",
      external: ["react", "preact"],
      plugins: [jsxPlugin([])],
    });
    const out = result.outputFiles[0]?.text ?? "";
    expect(out).toContain('from "react/jsx-runtime"');
    expect(out).toContain('from "preact/jsx-runtime"');
  });
});
