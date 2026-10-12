// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadPug, pugTree } from "@assemblejs/cli";
import type { PugCompiler } from "@assemblejs/cli";

const templates = fileURLToPath(new URL("../../../../examples/templates/", import.meta.url));
const installed = (): PugCompiler => {
  const pug = loadPug(templates);
  if (pug === undefined) throw new Error("the templates example has no Pug installed");
  return pug;
};

describe("the tree Pug's own parser makes of a template", () => {
  // Pug's README says nothing of plugins: the door is in its source, lib/index.js. Should a Pug
  // to come stop calling it, every Pug view goes unread, and this is what goes red.
  it("is handed over by the installed Pug, a tag as a node with its attributes as written", () => {
    expect(pugTree(installed(), 'section\n  assembly(name="price" view=data.as)')).toMatchObject({
      type: "Block",
      nodes: [
        {
          type: "Tag",
          name: "section",
          block: {
            nodes: [
              {
                type: "Tag",
                name: "assembly",
                attrs: [
                  { name: "name", val: '"price"' },
                  { name: "view", val: "data.as" },
                ],
              },
            ],
          },
        },
      ],
    });
  });

  it("is undefined for a source Pug cannot compile, which the template's own rule reports", () => {
    expect(pugTree(installed(), "p\n  - if (\n")).toBeUndefined();
    expect(pugTree(installed(), "include other")).toBeUndefined();
  });

  it("is undefined where a compiler never hands its tree over", () => {
    expect(pugTree({ compile: () => () => "" }, "p")).toBeUndefined();
  });

  it("leaves the compile it rode on as it was: the plugin answers the tree it was given", () => {
    const answered: unknown[] = [];
    const pug: PugCompiler = {
      compile: (source, options) => {
        answered.push(...options.plugins.map((plugin) => plugin.postParse({ of: source })));
        return undefined;
      },
    };
    expect(pugTree(pug, "p")).toEqual({ of: "p" });
    expect(answered).toEqual([{ of: "p" }]);
  });
});
