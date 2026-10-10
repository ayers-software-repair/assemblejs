// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, realpathSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { followLinks } from "@assemblejs/cli";

const scratch = (): string => realpathSync(mkdtempSync(join(tmpdir(), "links-")));

describe("where a path really leads", () => {
  it("follows a link to a directory, and carries the rest of the path over", () => {
    const dir = scratch();
    mkdirSync(join(dir, "real"));
    symlinkSync(join(dir, "real"), join(dir, "alias"));
    expect(followLinks(join(dir, "alias", "new", "file.txt"))).toBe(
      join(dir, "real", "new", "file.txt"),
    );
  });

  it("follows a link that points at nothing, relative or absolute", () => {
    const dir = scratch();
    symlinkSync("../elsewhere/x.md", join(dir, "relative"));
    symlinkSync("/nowhere/y.md", join(dir, "absolute"));
    expect(followLinks(join(dir, "relative"))).toBe(join(dir, "..", "elsewhere", "x.md"));
    expect(followLinks(join(dir, "absolute"))).toBe("/nowhere/y.md");
  });

  it("follows a chain of links, and throws on a loop", () => {
    const dir = scratch();
    symlinkSync(join(dir, "b"), join(dir, "a"));
    symlinkSync(join(dir, "c"), join(dir, "b"));
    expect(followLinks(join(dir, "a"))).toBe(join(dir, "c"));
    symlinkSync(join(dir, "loop2"), join(dir, "loop1"));
    symlinkSync(join(dir, "loop1"), join(dir, "loop2"));
    expect(() => followLinks(join(dir, "loop1"))).toThrow(/more than 40 links/);
  });
});
