// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { describe, expect, it } from "vitest";
import { RESOURCE_NOT_FOUND } from "@assemblejs/mcp";

describe("the code for a resource that does not exist", () => {
  it("is the one the protocol gives it", () => {
    expect(RESOURCE_NOT_FOUND).toBe(-32002);
  });

  it("is none of the codes the SDK names, which is why it is named here", () => {
    expect(Object.values(ErrorCode)).not.toContain(RESOURCE_NOT_FOUND);
  });
});
