// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { projectAssemblies, resolveRoot } from "@assemblejs/mcp";
import type { ProjectRoot } from "@assemblejs/mcp";

let root: ProjectRoot;
let dir = "";

const assembly = (name: string, file: string, contents: string): void => {
  const at = join(dir, "src", "assemblies", name);
  mkdirSync(at, { recursive: true });
  writeFileSync(join(at, file), contents);
};

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "assemblejs-mcp-"));
  mkdirSync(join(dir, "src", "assemblies"), { recursive: true });
  root = resolveRoot(dir);
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("a project's assemblies, as a server would declare them without a build", () => {
  it("makes a plain html view its file, read when it renders, with what its source places", async () => {
    assembly("shell", "shell.html", '<section><assembly name="cart"></assembly></section>');
    const shell = projectAssemblies(root).get("shell")?.views["default"];
    expect(shell?.placements).toEqual([{ name: "cart", view: "default" }]);
    // Read at render, so an edit made after this was built is what the next render shows.
    assembly("shell", "shell.html", "<p>edited</p>");
    expect(await shell?.markup({ data: {} })).toBe("<p>edited</p>");
  });

  it("makes every other view throw the reason it cannot be shown", () => {
    assembly("counter", "counter.react.tsx", "export default () => null;");
    assembly("notes", "notes.md", "# Notes");
    const all = projectAssemblies(root);
    expect([...all.keys()]).toEqual(["counter", "notes"]);
    expect(() => all.get("counter")?.views["default"]?.markup({ data: {} })).toThrow(
      /"counter" is a react assembly/,
    );
    expect(() => all.get("notes")?.views["default"]?.markup({ data: {} })).toThrow(/markdown/);
  });
});
