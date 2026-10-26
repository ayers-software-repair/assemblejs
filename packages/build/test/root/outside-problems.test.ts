// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { outsideProblems } from "@asmjs/build";
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
});

// A link that leads nowhere is not read either, and a reader that tried threw what the system
// said of the missing file, a stack and all, in check and in build alike.
describe("one finding for each path that is a link to nothing", () => {
  const { root } = linkedProject(
    { "src/assemblies/cart/cart.html": "<p>cart</p>" },
    { "src/assemblies/cart/gone.css": "no-such-file.css", "src/pages": "no-such-directory" },
  );
  const at = (path: string): string => join(root, path);

  it("says that it leads nowhere, by the same rule, and what to do", () => {
    expect(outsideProblems(root, [at("src/assemblies/cart/gone.css")])).toEqual([
      {
        path: at("src/assemblies/cart/gone.css"),
        rule: "a-project-stays-inside-its-root",
        message: "gone.css is a link that leads nowhere, and nothing is read through it",
        fix: "remove the link, or put the file it names where it points",
      },
    ]);
    expect(outsideProblems(root, [at("src/pages"), at("src/assemblies/cart/cart.html")])).toEqual([
      expect.objectContaining({ message: expect.stringContaining("pages is a link that leads") }),
    ]);
  });
});
