// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { startedRoot } from "@assemblejs/mcp";

const HERE = resolve("/work/here");

describe("the one project root a server works on, from how it was started", () => {
  // Cursor and VS Code fill their workspace folder into a server's arguments.
  it("is the directory it was given as its one argument, before anything else", () => {
    const root = startedRoot([resolve("/work/shop")], { CLAUDE_PROJECT_DIR: "/work/other" }, HERE);
    expect(root.path).toBe(resolve("/work/shop"));
    expect(root.__brand).toBe("ProjectRoot");
  });

  // Claude Code has no such variable for an argument, and names the root in the environment.
  it("is the one Claude Code names in its environment, where it was given none", () => {
    expect(startedRoot([], { CLAUDE_PROJECT_DIR: resolve("/work/shop") }, HERE).path).toBe(
      resolve("/work/shop"),
    );
  });

  it("is where it was started, where nothing names one", () => {
    expect(startedRoot([], {}, HERE).path).toBe(HERE);
    expect(startedRoot([""], { CLAUDE_PROJECT_DIR: "" }, HERE).path).toBe(HERE);
  });

  it("takes a relative one from where it was started", () => {
    expect(startedRoot(["shop"], {}, HERE).path).toBe(resolve(HERE, "shop"));
    expect(startedRoot([], { CLAUDE_PROJECT_DIR: "." }, HERE).path).toBe(HERE);
    expect(startedRoot([".."], {}, HERE).path).toBe(resolve("/work"));
  });
});
