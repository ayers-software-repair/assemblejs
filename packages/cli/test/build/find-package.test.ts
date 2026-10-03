// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { findPackage } from "@assemblejs/cli";

describe("finding a package the project installed", () => {
  it("looks in node_modules beside the project and each directory above it", () => {
    const top = mkdtempSync(join(tmpdir(), "find-"));
    mkdirSync(join(top, "node_modules", "@scope", "pkg"), { recursive: true });
    writeFileSync(join(top, "node_modules", "@scope", "pkg", "package.json"), "{}");
    const project = join(top, "apps", "web");
    mkdirSync(project, { recursive: true });
    expect(findPackage(project, "@scope/pkg")).toBe(join(top, "node_modules", "@scope", "pkg"));
  });

  it("is undefined when no directory above has it, whatever NODE_PATH holds", () => {
    const project = mkdtempSync(join(tmpdir(), "find-none-"));
    expect(findPackage(project, "@assemblejs/renderer-react")).toBeUndefined();
  });
});
