// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { AssemblyDefinition } from "@assemblejs/core";

describe("an assembly", () => {
  it("is a name and the views it answers under", () => {
    const definition: AssemblyDefinition = {
      name: "cart",
      views: { default: { renderer: "html", data: () => ({}), markup: () => "" } },
    };
    expect(Object.keys(definition.views)).toEqual(["default"]);
  });
});
