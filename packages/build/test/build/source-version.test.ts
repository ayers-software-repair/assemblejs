// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  renameSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import type * as NodeFs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OutsideRootError, sourceVersion } from "@assemblejs/build";
import { linkedProject } from "../fixtures/linked-project.js";

const walkGuard = vi.hoisted(() => ({
  refused: undefined as string | undefined,
  repeatLimit: undefined as number | undefined,
  visits: new Map<string, number>(),
}));

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof NodeFs>();
  return {
    ...actual,
    readdirSync: (path: string, options: { readonly withFileTypes: true }) => {
      const real = actual.realpathSync(path);
      if (real === walkGuard.refused) throw new Error(`walk entered ${real}`);
      const visits = (walkGuard.visits.get(real) ?? 0) + 1;
      walkGuard.visits.set(real, visits);
      if (walkGuard.repeatLimit !== undefined && visits > walkGuard.repeatLimit)
        throw new Error(`walk revisited ${real}`);
      return actual.readdirSync(path, options);
    },
  };
});

const project = (view: string): string => {
  const root = mkdtempSync(join(tmpdir(), "version-"));
  mkdirSync(join(root, "src", "assemblies", "a"), { recursive: true });
  writeFileSync(join(root, "package.json"), "{}");
  writeFileSync(join(root, "src", "assemblies", "a", "a.html"), view);
  return root;
};

describe("the version of a build's output", () => {
  afterEach(() => {
    walkGuard.refused = undefined;
    walkGuard.repeatLimit = undefined;
    walkGuard.visits.clear();
  });

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

  it("refuses a linked directory before enumerating outside the project", () => {
    const { root, outside } = linkedProject(
      { "package.json": "{}", "src/assemblies/a/a.html": "<p>a</p>" },
      { "src/borrowed": "outside:" },
    );
    walkGuard.refused = realpathSync(outside);
    expect(() => sourceVersion(root)).toThrow(OutsideRootError);
  });

  it("refuses a linked source root before enumerating outside the project", () => {
    const { root, outside } = linkedProject({ "package.json": "{}" }, { src: "outside:" });
    walkGuard.refused = realpathSync(outside);
    expect(() => sourceVersion(root)).toThrow(OutsideRootError);
  });

  it("refuses an in-root directory link that revisits an ancestor", () => {
    const root = project("<p>a</p>");
    symlinkSync(".", join(root, "src", "again"));
    walkGuard.repeatLimit = 1;
    expect(() => sourceVersion(root)).toThrow(OutsideRootError);
  });

  it("follows a directory link that stays inside the project", () => {
    const root = project("<p>a</p>");
    mkdirSync(join(root, "src", "shared"));
    writeFileSync(join(root, "src", "shared", "shared.css"), "p { color: red; }");
    symlinkSync("shared", join(root, "src", "linked"));
    const first = sourceVersion(root);
    writeFileSync(join(root, "src", "shared", "shared.css"), "p { color: blue; }");
    expect(sourceVersion(root)).not.toBe(first);
  });
});
