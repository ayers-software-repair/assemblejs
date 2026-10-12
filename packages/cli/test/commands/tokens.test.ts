// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { TOKENS } from "@assemblejs/cli";

describe("the tokens a new project starts with", () => {
  it("declare every role at :root, the three scales, and a dark scheme rebinding the colours", () => {
    for (const role of [
      "--surface",
      "--surface-panel",
      "--border",
      "--ink",
      "--ink-muted",
      "--accent",
      "--accent-strong",
      "--accent-alt",
      "--accent-wash",
      "--face-display",
      "--face-text",
      "--face-mono",
    ]) {
      expect(TOKENS.split(`${role}:`).length - 1, role).toBe(role.startsWith("--face") ? 1 : 2);
    }
    for (const scale of ["--space-1", "--space-4", "--text-1", "--text-4", "--corner"]) {
      expect(TOKENS).toContain(`${scale}:`);
    }
    expect(TOKENS).toContain("@media (prefers-color-scheme: dark)");
    expect(TOKENS.trimStart().startsWith("/*")).toBe(true);
  });

  // Found 2026-10-11, in a browser set to the dark scheme: the tokens flipped and the browser's
  // own surface, its scrollbars and its form controls did not.
  it("say the page is made for both schemes, so what the browser draws follows the tokens", () => {
    expect(TOKENS).toContain(":root {\n  color-scheme: light dark;");
  });
});
