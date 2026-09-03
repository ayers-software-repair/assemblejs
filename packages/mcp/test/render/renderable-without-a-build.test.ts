// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { RENDERABLE_WITHOUT_A_BUILD } from "@assemblejs/mcp";

describe("what can be shown immediately", () => {
  it("is the renderers whose view file is its own output", () => {
    expect(RENDERABLE_WITHOUT_A_BUILD).toEqual(["html", "markdown"]);
    // A framework view is source that must be compiled; approximating it would show an agent
    // something that is not what ships.
    expect(RENDERABLE_WITHOUT_A_BUILD).not.toContain("react");
  });
});
