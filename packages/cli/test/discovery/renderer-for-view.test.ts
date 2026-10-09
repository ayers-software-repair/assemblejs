// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { rendererForView } from "@assemblejs/cli";

describe("choosing a renderer from a file name", () => {
  it("reads an unambiguous extension directly", () => {
    expect(rendererForView("cart.svelte")).toBe("svelte");
    expect(rendererForView("cart.vue")).toBe("vue");
    expect(rendererForView("cart.html")).toBe("html");
    expect(rendererForView("cart.md")).toBe("markdown");
    expect(rendererForView("cart.ejs")).toBe("ejs");
    expect(rendererForView("cart.hbs")).toBe("handlebars");
    expect(rendererForView("cart.njk")).toBe("nunjucks");
    expect(rendererForView("cart.pug")).toBe("pug");
  });

  // React, Preact and Solid all write .tsx. A file that does not say which is a file whose
  // framework only the configuration knows, which is the thing a directory listing should tell
  // you instead.
  it("requires an infix where the extension is shared", () => {
    expect(rendererForView("cart.react.tsx")).toBe("react");
    expect(rendererForView("cart.preact.tsx")).toBe("preact");
    expect(rendererForView("cart.solid.jsx")).toBe("solid");
    expect(rendererForView("cart.tsx")).toBeUndefined();
  });

  it("reads a Lit view by its name among the project's own TypeScript", () => {
    expect(rendererForView("cart.lit.ts")).toBe("lit");
    expect(rendererForView("cart.lit.js")).toBe("lit");
    expect(rendererForView("cart.client.ts")).toBeUndefined();
    expect(rendererForView("cart.service.ts")).toBeUndefined();
  });

  it("is not a view when the extension means nothing here", () => {
    expect(rendererForView("cart.css")).toBeUndefined();
    expect(rendererForView("README")).toBeUndefined();
    expect(rendererForView("notes.txt")).toBeUndefined();
  });
});
