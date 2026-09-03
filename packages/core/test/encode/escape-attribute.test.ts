// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { escapeAttribute } from "@assemblejs/core";

describe("escaping an attribute value", () => {
  it("stops a value ending the attribute it sits in", () => {
    const escaped = escapeAttribute(`" onload="alert(1)`);
    expect(escaped).not.toContain('"');
    expect(`<div title="${escaped}">`).toBe(`<div title="&quot; onload=&quot;alert(1)">`);
  });

  it("escapes both quote characters, not only the one the emitter happens to use", () => {
    expect(escapeAttribute(`'`)).toBe("&#39;");
    expect(escapeAttribute(`"`)).toBe("&quot;");
  });

  it("escapes the ampersand first", () => {
    expect(escapeAttribute("&quot;")).toBe("&amp;quot;");
  });
});
