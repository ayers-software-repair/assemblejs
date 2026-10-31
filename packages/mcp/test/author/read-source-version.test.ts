// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { OutsideRootError } from "@asmjs/build";
import { describe, expect, it } from "vitest";
import { readSourceVersion, resolveRoot } from "@asmjs/mcp";

describe("reading the build's source identity without building", () => {
  const project = () => {
    const path = mkdtempSync(join(tmpdir(), "source-version-"));
    mkdirSync(join(path, "src"));
    writeFileSync(join(path, "package.json"), '{"name":"provided-project"}');
    writeFileSync(join(path, "src/view.html"), "<p>Saved source</p>");
    return resolveRoot(path);
  };

  it("returns a stable opaque identity without changing or returning source bytes", () => {
    const root = project();
    const before = readFileSync(join(root.path, "src/view.html"));
    const answer = readSourceVersion(root);
    expect(answer).toEqual({
      ok: true,
      result: { version: expect.stringMatching(/^[a-f0-9]{12}$/) },
      problems: [],
    });
    expect(readSourceVersion(root)).toEqual(answer);
    expect(JSON.stringify(answer)).not.toContain("Saved source");
    expect(readFileSync(join(root.path, "src/view.html"))).toEqual(before);
  });

  it.each(["src/view.html", "assemblejs.config.ts", "package.json"])(
    "observes a change to %s",
    (file) => {
      const root = project();
      const before = readSourceVersion(root);
      writeFileSync(join(root.path, file), "changed bytes");
      expect(readSourceVersion(root)).not.toEqual(before);
    },
  );

  it("refuses a linked source outside the project instead of fingerprinting it", () => {
    const root = project();
    const outside = mkdtempSync(join(tmpdir(), "outside-version-"));
    writeFileSync(join(outside, "private.html"), "outside data");
    symlinkSync(join(outside, "private.html"), join(root.path, "src/linked.html"));
    expect(() => readSourceVersion(root)).toThrow(OutsideRootError);
  });
});
