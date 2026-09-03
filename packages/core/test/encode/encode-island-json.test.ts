// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { encodeIslandJson } from "@assemblejs/core";

describe("encoding the data island", () => {
  it("round trips an ordinary payload", () => {
    const payload = { greeting: "hello", count: 2, items: [{ sku: "a" }] };
    expect(JSON.parse(encodeIslandJson(payload))).toEqual(payload);
  });

  // The named adversarial case: a payload that carries the sequence which would otherwise end
  // the script element it is written into.
  it("cannot close the script element that carries it", () => {
    const payload = { evil: `</script><script>alert(1)//` };
    const encoded = encodeIslandJson(payload);
    expect(encoded).not.toContain("</script");
    expect(encoded).not.toContain("<");
    // And it is still the same value once parsed, so nothing was destroyed to achieve that.
    expect(JSON.parse(encoded)).toEqual(payload);
  });

  it("escapes the two line separators, which some parsers treat as line terminators", () => {
    // Written as escapes, never as themselves: a character invisible in an editor is a
    // character nobody can review.
    const payload = { separated: `a\u2028b\u2029c` };
    const encoded = encodeIslandJson(payload);
    expect(encoded).not.toContain("\u2028");
    expect(encoded).not.toContain("\u2029");
    expect(encoded).toContain("\\u2028");
    expect(JSON.parse(encoded)).toEqual(payload);
  });

  it("escapes the ampersand, so an entity-decoding parser cannot rebuild a tag", () => {
    const encoded = encodeIslandJson({ x: "&lt;/script&gt;" });
    expect(encoded).not.toContain("&");
    expect(JSON.parse(encoded)).toEqual({ x: "&lt;/script&gt;" });
  });
});
