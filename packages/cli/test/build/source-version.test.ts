// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, renameSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { sourceVersion } from "@assemblejs/cli";

const project = (view: string): string => {
  const root = mkdtempSync(join(tmpdir(), "version-"));
  mkdirSync(join(root, "src", "assemblies", "a"), { recursive: true });
  writeFileSync(join(root, "package.json"), "{}");
  writeFileSync(join(root, "src", "assemblies", "a", "a.html"), view);
  return root;
};

describe("the version of a build's output", () => {
  it("is the same for the same sources, and different when any source changes", () => {
    expect(sourceVersion(project("<p>a</p>"))).toBe(sourceVersion(project("<p>a</p>")));
    expect(sourceVersion(project("<p>a</p>"))).not.toBe(sourceVersion(project("<p>b</p>")));
    expect(sourceVersion(project("<p>a</p>"))).toMatch(/^[0-9a-f]{12}$/);
  });

  it("changes when a file moves, even with its content the same", () => {
    const moved = project("<p>a</p>");
    mkdirSync(join(moved, "src", "assemblies", "b"));
    renameSync(
      join(moved, "src", "assemblies", "a", "a.html"),
      join(moved, "src", "assemblies", "b", "b.html"),
    );
    expect(sourceVersion(moved)).not.toBe(sourceVersion(project("<p>a</p>")));
  });
});
