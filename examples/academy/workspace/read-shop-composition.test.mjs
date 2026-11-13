// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { test } from "node:test";
import { Window } from "happy-dom";
import { readShopComposition } from "./read-shop-composition.js";

test("composition requires real local and remote envelopes at the preview revision", async () => {
  const window = new Window();
  const url = "https://preview.example/p/kb-guji-250";
  let version = "abcdef123456";
  const preview = { url, version };
  const client = {
    async callTool() {
      return {
        content: [
          { type: "text", text: JSON.stringify({ ok: true, problems: [], result: { version } }) },
        ],
      };
    },
  };
  const html =
    '<assembly-root data-name="buy-box"></assembly-root>' +
    '<assembly-root data-name="product-detail" data-remote="https://catalog.example"></assembly-root>';
  const signal = new AbortController().signal;
  const read = (readPage) =>
    readShopComposition(window.document, client, preview, readPage, signal);
  try {
    assert.deepEqual((await read(async () => ({ url, html }))).assemblies, [
      { name: "buy-box", origin: null },
      { name: "product-detail", origin: "https://catalog.example" },
    ]);
    const calculator = '<assembly-root data-name="price-calculator"></assembly-root>';
    assert.equal((await read(async () => ({ url, html }))).calculatorBesideBuyBox, false);
    assert.equal(
      (await read(async () => ({ url, html: html + calculator }))).calculatorBesideBuyBox,
      false,
    );
    const adjacent = html.replace(
      '<assembly-root data-name="product-detail"',
      calculator + '<assembly-root data-name="product-detail"',
    );
    assert.equal((await read(async () => ({ url, html: adjacent }))).calculatorBesideBuyBox, false);
    const rendered = calculator.replace(
      "</assembly-root>",
      '<section aria-label="Order estimate"><h2>Order estimate</h2><div aria-label="Quantity presets"><button type="button">1 item</button></div></section></assembly-root>',
    );
    assert.equal(
      (await read(async () => ({ url, html: adjacent.replace(calculator, rendered) })))
        .calculatorBesideBuyBox,
      true,
    );
    await assert.rejects(
      read(async () => ({ url, html: html.replace(' data-remote="https://catalog.example"', "") })),
      /unexpected composition/,
    );
    await assert.rejects(
      read(async () => {
        version = "123456abcdef";
        return { url, html };
      }),
      /Saved source changed/,
    );
  } finally {
    window.close();
  }
});
