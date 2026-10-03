// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { defineApi, defineAssembly, summarizeProject } from "@assemblejs/core";

describe("the project as devtools may read it", () => {
  it("copies names, routes and settings, and nothing that runs", () => {
    const cart = defineAssembly({
      name: "cart",
      shadow: true,
      mount: "idle",
      views: {
        default: { renderer: "react", markup: () => "" },
        wide: { renderer: "html", markup: () => "" },
      },
    });
    const summary = summarizeProject({
      mode: "development",
      version: "abc",
      assemblies: [
        cart,
        defineAssembly({
          name: "plain",
          views: { default: { renderer: "html", markup: () => "" } },
        }),
      ],
      pages: [{ route: "/", template: "<p>secret template</p>", stream: "/live" }],
      apis: [
        defineApi({ path: "/live", stream: () => undefined }),
        defineApi({ path: "/x", method: "POST", handle: () => null }),
      ],
      remotes: [{ origin: "https://shop.example.com", forward: ["cookie"] }],
    });
    expect(summary).toEqual({
      mode: "development",
      version: "abc",
      assemblies: [
        {
          name: "cart",
          views: [
            { name: "default", renderer: "react" },
            { name: "wide", renderer: "html" },
          ],
          mount: "idle",
          shadow: true,
        },
        {
          name: "plain",
          views: [{ name: "default", renderer: "html" }],
          mount: "load",
          shadow: false,
        },
      ],
      pages: [{ route: "/", stream: "/live" }],
      apis: [
        { method: "GET", path: "/live", streams: true },
        { method: "POST", path: "/x", streams: false },
      ],
      remotes: [{ origin: "https://shop.example.com" }],
    });
    expect(JSON.stringify(summary)).not.toContain("secret template");
  });
});
