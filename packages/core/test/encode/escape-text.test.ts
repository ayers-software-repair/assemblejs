// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { escapeText } from "@assemblejs/core";

describe("escaping a value that sits between tags", () => {
  it("neutralises a tag", () => {
    expect(escapeText("<script>alert(1)</script>")).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("escapes the ampersand first, so the escapes do not escape each other", () => {
    expect(escapeText("&lt;")).toBe("&amp;lt;");
  });

  it("leaves ordinary text alone", () => {
    expect(escapeText("Hello, world")).toBe("Hello, world");
  });
});
