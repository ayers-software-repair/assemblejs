// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { markRemote } from "@assemblejs/core";

const envelope = '<assembly-root data-name="cart" data-id="1"><p>x</p></assembly-root>';

describe("stamping a remote fragment with its origin", () => {
  it("adds the origin to the envelope, encoded", () => {
    expect(markRemote(envelope, "https://a.example.com")).toBe(
      '<assembly-root data-remote="https://a.example.com" data-name="cart" data-id="1"><p>x</p></assembly-root>',
    );
    expect(markRemote(envelope, 'https://a"b')).toContain('data-remote="https://a&quot;b"');
  });

  it("keeps the origin of a fragment that came from further away", () => {
    const nested =
      '<assembly-root data-remote="https://far.example.com" data-name="c"></assembly-root>';
    expect(markRemote(nested, "https://near.example.com")).toBe(nested);
  });

  it("is undefined for anything that is not one envelope", () => {
    for (const html of [
      "<p>x</p>",
      "<assembly-rootx></assembly-rootx>",
      '<assembly-root data-name="a">',
    ]) {
      expect(markRemote(html, "https://a.example.com")).toBeUndefined();
    }
  });
});
