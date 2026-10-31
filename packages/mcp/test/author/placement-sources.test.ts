// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveRoot } from "@asmjs/mcp";
import { placementSources } from "../../src/author/placement-sources.js";

describe("the sources used to validate a placement", () => {
  it("changes for imported component edits and newly discovered assemblies", () => {
    const dir = mkdtempSync(join(tmpdir(), "placement-sources-"));
    const own = join(dir, "src/assemblies/shell");
    mkdirSync(own, { recursive: true });
    writeFileSync(join(own, "shell.react.tsx"), 'import "./part.js"; export default () => null;');
    writeFileSync(join(own, "part.tsx"), "export default () => <p>before</p>;");
    const root = resolveRoot(dir);
    const first = placementSources(root);
    writeFileSync(join(own, "part.tsx"), "export default () => <p>after</p>;");
    const second = placementSources(root);
    expect(second).not.toBe(first);
    mkdirSync(join(dir, "src/assemblies/cart"));
    writeFileSync(join(dir, "src/assemblies/cart/cart.html"), "cart");
    expect(placementSources(root)).not.toBe(second);
  });

  it("does not open an imported module outside the project", () => {
    const dir = mkdtempSync(join(tmpdir(), "placement-outside-"));
    const outside = mkdtempSync(join(tmpdir(), "placement-secret-"));
    const own = join(dir, "src/assemblies/shell");
    mkdirSync(own, { recursive: true });
    writeFileSync(join(own, "shell.react.tsx"), 'import "./part.js"; export default () => null;');
    writeFileSync(join(outside, "secret.tsx"), "SECRET_CONTENT");
    symlinkSync(join(outside, "secret.tsx"), join(own, "part.tsx"));
    expect(placementSources(resolveRoot(dir))).not.toContain("SECRET_CONTENT");
  });
});
