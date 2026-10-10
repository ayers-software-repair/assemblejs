// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { preactRenderer } from "@assemblejs/renderer-preact";
import type { AssemblyProps } from "@assemblejs/renderer-preact";

const Cart = ({ data }: AssemblyProps) => <p>{String(data["greeting"])}</p>;

describe("the Preact renderer", () => {
  it("claims the extensions that say which framework wrote the file", () => {
    expect(preactRenderer.name).toBe("preact");
    expect(preactRenderer.extensions).toEqual([".preact.tsx", ".preact.jsx"]);
    expect(preactRenderer.extensions).not.toContain(".tsx");
  });

  it("renders through the interface core defines", async () => {
    const html = await preactRenderer.render({
      template: Cart,
      data: { greeting: "hello" },
      helpers: {},
      url: new URL("https://example.com/"),
    });
    expect(html).toBe("<p>hello</p>");
  });
});
