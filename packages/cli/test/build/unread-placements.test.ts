// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { unreadPlacements } from "@assemblejs/cli";
import type { ProjectProblem } from "@assemblejs/cli";

const problem = (rule: ProjectProblem["rule"], message: string): ProjectProblem => ({
  path: "src/assemblies/shell/shell.html",
  rule,
  message,
  fix: "",
});

describe("what a build refuses of what is wrong with a project's views", () => {
  it("is a placement that cannot be read, and one no assembly could be named", () => {
    const unread = problem(
      "a-placement-names-an-assembly",
      "holds a placement that cannot be read",
    );
    const unnameable = problem("a-placement-names-an-assembly", 'places "Cart"');
    expect(unreadPlacements([unread, unnameable])).toEqual([unread, unnameable]);
  });

  it("is not what check and boot hold a view to: such a view still builds", () => {
    expect(
      unreadPlacements([
        problem("a-placement-is-named-where-it-is-written", "a name is computed"),
        problem("a-project-stays-inside-its-root", "imports what is outside"),
        problem("an-assembly-is-never-its-own-ancestor", "places itself"),
      ]),
    ).toEqual([]);
  });
});
