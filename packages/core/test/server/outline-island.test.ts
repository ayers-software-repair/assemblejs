// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { OUTLINE_ATTRIBUTE, outlineIsland } from "@asmjs/core";

describe("the block a page carries for its outline", () => {
  it("is data a browser does not run, marked as the outline's", () => {
    const block = outlineIsland({ route: "/", ms: 3, placements: [] });
    expect(block).toBe(
      `<script type="application/json" ${OUTLINE_ATTRIBUTE}>{"route":"/","ms":3,"placements":[]}</script>`,
    );
  });

  it("cannot be ended by anything written in it", () => {
    const block = outlineIsland({
      route: "/</script><script>alert(1)</script>",
      ms: 0,
      placements: [{ id: "1", name: "<!--", view: "default", source: "local", ms: 0 }],
    });
    expect(block.match(/<\/script>/g)).toHaveLength(1);
    expect(block).not.toContain("<!--");
  });
});
