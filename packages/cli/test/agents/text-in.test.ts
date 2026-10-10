// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { textIn } from "@assemblejs/cli";

describe("a project's files, read as text by their path from its root", () => {
  const root = mkdtempSync(join(tmpdir(), "text-in-"));
  mkdirSync(join(root, ".vscode"));
  writeFileSync(join(root, ".vscode", "mcp.json"), '{ "servers": {} }');
  mkdirSync(join(root, "AGENTS.md"));

  it("is what the file holds", () => {
    expect(textIn(root)(".vscode/mcp.json")).toBe('{ "servers": {} }');
  });

  it("is nothing for a file the project does not have, or for what is no file to read", () => {
    expect(textIn(root)(".mcp.json")).toBeUndefined();
    expect(textIn(root)("AGENTS.md")).toBeUndefined();
  });
});
