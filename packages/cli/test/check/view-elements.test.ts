// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { discoverAssemblies, viewElements } from "@assemblejs/cli";

let root = "";
afterEach(() => rmSync(root, { recursive: true, force: true }));
const project = (files: Readonly<Record<string, string>>): string => {
  root = mkdtempSync(join(tmpdir(), "elements-"));
  for (const [path, contents] of Object.entries(files)) {
    mkdirSync(join(root, path, ".."), { recursive: true });
    writeFileSync(join(root, path), contents);
  }
  return root;
};

describe("the elements each assembly's view writes", () => {
  it("reads each view by its kind, a framework view with the components it is split into", () => {
    project({
      "src/assemblies/card/card.html": '<section><img alt=""></section>',
      "src/assemblies/counter/counter.react.tsx":
        'import { Face } from "./face.js";\nexport default () => <button><Face /></button>;',
      "src/assemblies/counter/face.tsx": "export const Face = () => <span />;",
    });
    const found = viewElements(root, discoverAssemblies(root).assemblies);
    expect([...found.keys()].sort()).toEqual(["card", "counter"]);
    expect(found.get("card")?.map(({ element }) => element.tag)).toEqual(["section", "img"]);
    expect(
      found.get("counter")?.map(({ file, element }) => [file.split("/").at(-1), element.tag]),
    ).toEqual([
      ["counter.react.tsx", "button"],
      ["face.tsx", "span"],
    ]);
  });

  it("leaves out a view it cannot read for its elements", () => {
    project({ "src/assemblies/broken/broken.react.tsx": "export default (" });
    expect(viewElements(root, discoverAssemblies(root).assemblies).size).toBe(0);
  });
});
