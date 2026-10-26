// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { readTokens } from "@asmjs/build";

describe("the tokens a stylesheet binds at :root", () => {
  it("reads the light scheme at the top, and the dark one rebinding it under its media rule", () => {
    const { light, dark } = readTokens(`
:root { --ink: #111; --surface: #fff; --corner: 4px; }
@media (prefers-color-scheme: dark) { :root { --ink: #eee; --surface: #000; } }
@media (min-width: 40rem) { :root { --corner: 8px; } }
.panel { --ink: #f00; }
`);
    expect([...light]).toEqual([
      ["--ink", "#111"],
      ["--surface", "#fff"],
      ["--corner", "4px"],
    ]);
    expect([...dark]).toEqual([
      ["--ink", "#eee"],
      ["--surface", "#000"],
      ["--corner", "4px"],
    ]);
  });

  it("reads nothing from a sheet with no :root, and throws for one it cannot parse", () => {
    expect(readTokens("body { color: red }").light.size).toBe(0);
    expect(() => readTokens(":root { --ink: ")).toThrow();
  });
});
