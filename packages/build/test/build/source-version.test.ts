// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, renameSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { OutsideRootError, sourceVersion } from "@assemblejs/build";
import { linkedProject } from "../fixtures/linked-project.js";

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

  // The walk asked the system what each entry was, and a link to nothing answered with a throw.
  it("passes over a link that leads nowhere, which check names, and hashes the rest", () => {
    const { root } = linkedProject(
      { "package.json": "{}", "src/assemblies/a/a.html": "<p>a</p>" },
      { "src/assemblies/a/gone.css": "no-such-file.css", "src/lost": "no-such-directory" },
    );
    expect(sourceVersion(root)).toMatch(/^[0-9a-f]{12}$/);
  });

  it("refuses, unopened, a source that is a link out of the project", () => {
    const { root } = linkedProject(
      { "package.json": "{}", "src/assemblies/a/a.html": "<p>a</p>" },
      { "src/assemblies/a/a.css": "outside:secret.css" },
    );
    expect(() => sourceVersion(root)).toThrow(OutsideRootError);
  });
});
