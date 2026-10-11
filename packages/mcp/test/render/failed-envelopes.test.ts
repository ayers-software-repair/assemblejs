// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { renderEnvelope } from "@assemblejs/core";
import { describe, expect, it } from "vitest";
import { failedEnvelopes } from "@assemblejs/mcp";

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

describe("the envelopes in markup that are marked failed", () => {
  it("are each one's assembly and the id its failure is logged against, at any depth, in order", () => {
    const html = envelope(
      "shell",
      `<section>${envelope("price", "", "c0ffee12")}${envelope("cart", envelope("badge", "<p>soon</p>", "deadbeef"))}</section>`,
    );
    expect(failedEnvelopes(html)).toEqual([
      { name: "price", id: "c0ffee12" },
      { name: "badge", id: "deadbeef" },
    ]);
  });

  it("are none in markup where every assembly answered, or where the word stands in text alone", () => {
    expect(failedEnvelopes(envelope("shell", envelope("cart", "<p>two</p>")))).toEqual([]);
    expect(failedEnvelopes("<p>data-failed</p><!-- <assembly-root data-failed='x'> -->")).toEqual(
      [],
    );
    // The word on any other element is that element's own, and no envelope's.
    expect(failedEnvelopes('<div data-name="cart" data-failed="x"></div>')).toEqual([]);
  });
});
