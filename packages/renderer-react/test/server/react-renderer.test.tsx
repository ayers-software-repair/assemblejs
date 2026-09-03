// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { reactRenderer } from "@assemblejs/renderer-react";
import type { AssemblyProps } from "@assemblejs/renderer-react";

const Cart = ({ data }: AssemblyProps) => <p>{String(data["greeting"])}</p>;

describe("the React renderer", () => {
  it("claims the extensions that say which framework wrote the file", () => {
    expect(reactRenderer.name).toBe("react");
    // React, Preact and Solid all write .tsx. A bare .tsx would be a file whose framework only
    // the configuration knows.
    expect(reactRenderer.extensions).toEqual([".react.tsx", ".react.jsx"]);
    expect(reactRenderer.extensions).not.toContain(".tsx");
  });

  it("renders through the interface core defines", async () => {
    const html = await reactRenderer.render({
      template: Cart,
      data: { greeting: "hello" },
      children: {},
      helpers: {},
      url: new URL("https://example.com/"),
    });
    expect(html).toBe("<p>hello</p>");
  });
});
