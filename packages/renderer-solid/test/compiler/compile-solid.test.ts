// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { compileSolid } from "@assemblejs/renderer-solid/compiler";

const view = 'export default (props) => <p class="a">{props.data.n}</p>;';

describe("compiling a Solid component", () => {
  it("builds strings with hydration keys for the server", () => {
    const code = compileSolid(view, { filename: "/p/a.solid.jsx", side: "server" });
    expect(code).toContain("ssrHydrationKey");
    expect(code).toContain('from "solid-js/web"');
  });

  it("builds hydratable DOM creation for the browser", () => {
    const code = compileSolid(view, { filename: "/p/a.solid.jsx", side: "client" });
    expect(code).toContain("getNextElement");
    expect(code).not.toContain("ssrHydrationKey");
  });

  it("throws with the file for JSX it cannot read", () => {
    expect(() =>
      compileSolid("export default () => <p>", { filename: "/p/broken.solid.jsx", side: "client" }),
    ).toThrow(/broken\.solid\.jsx/);
  });
});
