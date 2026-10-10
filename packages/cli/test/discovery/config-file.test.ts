// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { CONFIG_FILE } from "@assemblejs/cli";

describe("the file a project declares its policy in", () => {
  it("is named once, by its path from the project's root", () => {
    expect(CONFIG_FILE).toBe("assemblejs.config.ts");
  });
});
