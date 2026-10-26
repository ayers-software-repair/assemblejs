// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { DEV_RECORD } from "@asmjs/build";

describe("where dev records its server's url", () => {
  it("is one file under the project's generated directory", () => {
    expect(DEV_RECORD).toBe(".assemblejs/dev.json");
  });
});
