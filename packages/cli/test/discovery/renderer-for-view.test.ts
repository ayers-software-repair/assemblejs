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

  it("is not a view when the extension means nothing here", () => {
    expect(rendererForView("cart.css")).toBeUndefined();
    expect(rendererForView("README")).toBeUndefined();
    expect(rendererForView("notes.txt")).toBeUndefined();
  });
});
