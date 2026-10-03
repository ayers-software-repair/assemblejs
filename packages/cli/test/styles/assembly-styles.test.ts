// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { AssemblyStyles } from "@assemblejs/cli";

describe("where an assembly's built stylesheets are served", () => {
  it("has no shadow sheet for a view that cannot opt into a shadow root", () => {
    const html: AssemblyStyles = { scoped: "/s/cart-1.css", shadow: undefined };
    expect(html.shadow).toBeUndefined();
  });
});
