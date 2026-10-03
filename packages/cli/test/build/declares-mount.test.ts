// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { declaresMount } from "@assemblejs/cli";

describe("whether a view says when its browser half runs", () => {
  it("is true for an exported mount, in a component file or a module script", () => {
    expect(declaresMount('export const mount = "visible";\nexport default function A() {}')).toBe(
      true,
    );
    expect(
      declaresMount('<script module>\n  export const mount: MountMode = "idle";\n</script>'),
    ).toBe(true);
  });

  it("is false for anything that only mentions one", () => {
    expect(declaresMount("const mount = 1;")).toBe(false);
    expect(declaresMount("// export const mount = 'visible'")).toBe(false);
  });
});
