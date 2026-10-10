// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { holdsFailedEnvelope, renderEnvelope } from "@assemblejs/core";

const envelope = (name: string, markup: string, failed?: string): string =>
  renderEnvelope({
    id: `id-${name}`,
    name,
    view: "default",
    renderer: "html",
    markup,
    data: {},
    ...(failed === undefined ? {} : { failed }),
  });

describe("whether markup holds a failed envelope", () => {
  it("is true of an envelope marked failed, however deep it sits", () => {
    expect(holdsFailedEnvelope(envelope("cart", "", "c-1"))).toBe(true);
    const deep = envelope("shell", `<section>${envelope("cart", "", "c-2")}</section>`);
    expect(holdsFailedEnvelope(deep)).toBe(true);
    expect(holdsFailedEnvelope(envelope("page", envelope("shell", deep)))).toBe(true);
  });

  it("is false of envelopes that answered, whatever their markup and data say", () => {
    expect(holdsFailedEnvelope(envelope("cart", "<p>two items</p>"))).toBe(false);
    expect(holdsFailedEnvelope(envelope("shell", envelope("cart", "<p>two</p>")))).toBe(false);
    // The attribute on another element, and the word in text, are not an envelope marked failed.
    expect(holdsFailedEnvelope(envelope("cart", '<div data-failed="x">data-failed</div>'))).toBe(
      false,
    );
    // Data naming the whole tag reaches the island with its "<" written as an escape.
    const withData = renderEnvelope({
      id: "i",
      name: "note",
      view: "default",
      renderer: "html",
      markup: "",
      data: { text: '<assembly-root data-name="x" data-failed="c">' },
    });
    expect(holdsFailedEnvelope(withData)).toBe(false);
  });
});
