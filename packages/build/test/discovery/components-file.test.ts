// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { COMPONENTS_FILE } from "@assemblejs/build";

describe("where a project styles the components HTML has", () => {
  it("is one stylesheet under src, beside the tokens", () => {
    expect(COMPONENTS_FILE).toBe("src/components.css");
  });
});
