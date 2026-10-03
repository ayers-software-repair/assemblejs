// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
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
});
