// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { RULES, outsideProblems } from "@assemblejs/cli";
import { linkedProject } from "../fixtures/linked-project.js";

describe("one finding for each path that leads out of the project", () => {
  const { root } = linkedProject(
    { "src/api/time.api.ts": "export default {};" },
    { "src/api/prices.api.ts": "outside:secret.api.ts", "src/pages/landing": "outside:pagedir" },
  );
  const at = (path: string): string => join(root, path);

  it("names the path, the rule that says why, and what to do", () => {
    expect(outsideProblems(root, [at("src/api/prices.api.ts")])).toEqual([
      {
        path: at("src/api/prices.api.ts"),
        rule: "a-project-stays-inside-its-root",
        message: "prices.api.ts leads out of the project, and nothing outside the project is read",
        fix: "put the file or directory itself where the link is, or bring what it leads to in as a package",
      },
    ]);
  });

  it("is nothing for a path inside, and for one a caller did not have", () => {
    expect(outsideProblems(root, [at("src/api/time.api.ts"), undefined])).toEqual([]);
  });

  it("is one for each, in the order asked, a directory like a file", () => {
    expect(
      outsideProblems(root, [
        at("src/pages/landing"),
        at("src/api/time.api.ts"),
        at("src/api/prices.api.ts"),
      ]).map((problem) => problem.path),
    ).toEqual([at("src/pages/landing"), at("src/api/prices.api.ts")]);
  });

  it("names a rule that explain can answer", () => {
    const rule = RULES.find((one) => one.id === "a-project-stays-inside-its-root");
    expect(rule?.because).toMatch(/an agent is shown what they read/);
  });
});
