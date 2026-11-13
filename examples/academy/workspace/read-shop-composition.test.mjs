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
