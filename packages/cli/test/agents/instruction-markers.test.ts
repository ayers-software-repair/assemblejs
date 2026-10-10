// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { INSTRUCTION_MARKERS } from "@assemblejs/cli";

describe("the two comments around the part of AGENTS.md the command line writes", () => {
  it("are comments, so someone reading the rendered file sees neither", () => {
    expect(INSTRUCTION_MARKERS.begin).toMatch(/^<!-- [^>]+ -->$/);
    expect(INSTRUCTION_MARKERS.end).toBe("<!-- /assemblejs:instructions -->");
  });

  // An earlier version may have said something else after these words; its part is still found.
  it("open the same way whatever a version says after it", () => {
    expect(INSTRUCTION_MARKERS.opening).toBe("<!-- assemblejs:instructions");
    expect(INSTRUCTION_MARKERS.begin.startsWith(`${INSTRUCTION_MARKERS.opening}. `)).toBe(true);
    expect(INSTRUCTION_MARKERS.end.startsWith(INSTRUCTION_MARKERS.opening)).toBe(false);
  });

  it("say, to whoever opens the file, who keeps the part and what rewrites it", () => {
    expect(INSTRUCTION_MARKERS.begin).toContain("`assemblejs check` holds this part current");
    expect(INSTRUCTION_MARKERS.begin).toContain("`assemblejs add agents` rewrites it");
  });
});
