// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { jsxSource } from "@assemblejs/cli";
import type { DiscoveredAssembly } from "@assemblejs/cli";

const assembly = (name: string, renderer: string): DiscoveredAssembly => ({
  name,
  directory: `/p/src/assemblies/${name}`,
  view: `/p/src/assemblies/${name}/${name}.${renderer}.tsx`,
  renderer,
  client: undefined,
  service: undefined,
  styles: [],
});
const assemblies = [assembly("cart", "preact"), assembly("shop", "react")];

describe("the JSX runtime a file compiles through", () => {
  it("is the one a file names", () => {
    expect(jsxSource("/p/src/lib/button.preact.tsx", assemblies)).toBe("preact");
    expect(jsxSource("/p/src/assemblies/cart/inner.react.jsx", assemblies)).toBe("react");
  });

  it("is its assembly's, for a component that names none", () => {
    expect(jsxSource("/p/src/assemblies/cart/parts/row.tsx", assemblies)).toBe("preact");
    expect(jsxSource("/p/src/assemblies/shop/row.tsx", assemblies)).toBe("react");
    // A name starting with dots is a name, not a step out of the directory.
    expect(jsxSource("/p/src/assemblies/cart/..row.tsx", assemblies)).toBe("preact");
  });

  it("is React for anything else", () => {
    expect(jsxSource("/p/src/lib/button.tsx", assemblies)).toBe("react");
    expect(jsxSource("/p/src/assemblies/cartx/row.tsx", assemblies)).toBe("react");
  });
});
