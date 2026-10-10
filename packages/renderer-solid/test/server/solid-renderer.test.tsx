// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { solidRenderer } from "@assemblejs/renderer-solid";
import type { AssemblyProps } from "@assemblejs/renderer-solid";

const Cart = (props: AssemblyProps) => <p>{String(props.data["greeting"])}</p>;

describe("the Solid renderer", () => {
  it("claims the extensions that say which framework wrote the file", () => {
    expect(solidRenderer.name).toBe("solid");
    expect(solidRenderer.extensions).toEqual([".solid.tsx", ".solid.jsx"]);
    expect(solidRenderer.extensions).not.toContain(".tsx");
  });

  it("renders through the interface core defines", async () => {
    const html = await solidRenderer.render({
      template: Cart,
      data: { greeting: "hello" },
      helpers: {},
      url: new URL("https://example.com/"),
    });
    expect(html).toContain(">hello</p>");
  });
});
