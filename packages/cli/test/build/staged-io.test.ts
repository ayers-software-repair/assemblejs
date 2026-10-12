// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { stagedIo } from "@assemblejs/cli";
import type { Io } from "@assemblejs/cli";

describe("an io that writes one directory's files beneath another", () => {
  const recorded = (): Io & { calls: string[] } => {
    const calls: string[] = [];
    return {
      calls,
      write: (path) => void calls.push(`write ${path}`),
      exists: (path) => (calls.push(`exists ${path}`), true),
      remove: (path) => void calls.push(`remove ${path}`),
      log: (line) => void calls.push(`log ${line}`),
      error: (line) => void calls.push(`error ${line}`),
    };
  };
  const root = join("/", "project");
  const dist = join(root, "dist");
  const building = join(root, ".assemblejs", "building");

  it("moves what is addressed beneath the one directory, at any depth, and the directory itself", () => {
    const io = recorded();
    const staged = stagedIo(io, dist, building);
    staged.write(join(dist, "client", "styles", "a.css"), "p{}");
    staged.exists(join(dist, "server.js"));
    staged.remove(dist);
    expect(io.calls).toEqual([
      `write ${join(building, "client", "styles", "a.css")}`,
      `exists ${join(building, "server.js")}`,
      `remove ${building}`,
    ]);
  });

  it("leaves everything else where it is addressed, a neighbour with a like name included", () => {
    const io = recorded();
    const staged = stagedIo(io, dist, building);
    staged.write(join(root, ".assemblejs", "project.ts"), "");
    staged.write(join(root, "dist-notes", "a.txt"), "");
    staged.write(join(root, "package.json"), "");
    staged.log("built");
    staged.error("refused");
    expect(io.calls).toEqual([
      `write ${join(root, ".assemblejs", "project.ts")}`,
      `write ${join(root, "dist-notes", "a.txt")}`,
      `write ${join(root, "package.json")}`,
      "log built",
      "error refused",
    ]);
  });
});
