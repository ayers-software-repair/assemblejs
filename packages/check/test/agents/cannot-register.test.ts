// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { cannotRegister } from "@asmjs/check";

describe("why a registration that cannot be read stops a write to it", () => {
  it("names the file, the commonest cause, and what would be lost", () => {
    expect(cannotRegister(".vscode/mcp.json")).toBe(
      ".vscode/mcp.json is not JSON, which a comment in it is enough to cause, and a server cannot be added to it without losing what it holds",
    );
  });
});
