// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { defineService, viewSchema } from "@assemblejs/core";
import type { AssemblyView } from "@assemblejs/core";

describe("the composed schema of one view", () => {
  it("merges the services' schemas and the view's own", () => {
    const view: AssemblyView = {
      renderer: "html",
      markup: () => "",
      services: [
        defineService({
          name: "greeting",
          schema: { properties: { greeting: { type: "string" } } },
          run: () => ({ greeting: "hi" }),
        }),
        defineService({ name: "untyped", run: () => ({}) }),
      ],
      schema: { properties: { title: { type: "string" } }, required: ["title"] },
    };
    const { schema, problems } = viewSchema(view);
    expect(problems).toEqual([]);
    expect(Object.keys(schema.properties)).toEqual(["greeting", "title"]);
    expect(schema.required).toEqual(["title"]);
  });

  it("names the view's own data when it collides with a service", () => {
    const view: AssemblyView = {
      renderer: "html",
      markup: () => "",
      services: [
        defineService({
          name: "base",
          schema: { properties: { title: {} } },
          run: () => ({ title: "x" }),
        }),
      ],
      schema: { properties: { title: {} } },
    };
    expect(viewSchema(view).problems.join()).toMatch(/service "base" and the view's own data/);
  });
});
