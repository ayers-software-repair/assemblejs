// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { test } from "node:test";
import { Window } from "happy-dom";
import { calculatorEvidence } from "./calculator-evidence.js";

const settings = { label: "Coffee & total", heading: "Coffee & total", values: [1, 3] };
const html =
  '<assembly-root data-name="price-calculator"><section aria-label="Coffee &amp; total"><h2>Coffee &amp; total</h2><div aria-label="Quantity presets"><button type="button">1 item</button><button type="button">3 items</button></div></section></assembly-root>';
const evidence = () => ({
  html,
  quotes: [1, 3].map((quantity) => ({
    quantity,
    status: 200,
    body: {
      lines: [{ sku: "kb-guji-250", quantity, cents: 1600 }],
      cents: quantity * 1600,
      problems: [],
    },
  })),
});

test("actual served settings and server-priced quantities produce a bounded output report", () => {
  const window = new Window();
  try {
    const result = calculatorEvidence(window.document, evidence(), settings);
    assert.equal(result.title, "Coffee & total");
    assert.deepEqual(
      result.quotes.map((quote) => [quote.quantity, quote.cents]),
      [
        [1, 1600],
        [3, 4800],
      ],
    );
    assert.equal(window.document.body.children.length, 0);
  } finally {
    window.close();
  }
});

test("wrong, duplicated, failed or inert-only calculator output cannot pass", () => {
  const window = new Window();
  try {
    for (const changed of [
      html.replace("<h2>Coffee &amp; total", "<h2>Old title"),
      html.replace("3 items", "6 items"),
      html + html,
      html.replace('data-name="price-calculator"', 'data-name="price-calculator" data-failed=""'),
      `<!-- ${html} -->`,
      `<script>${html}</script>`,
      `<template>${html}</template>`,
      "x".repeat(524289),
    ])
      assert.throws(() =>
        calculatorEvidence(window.document, { ...evidence(), html: changed }, settings),
      );
  } finally {
    window.close();
  }
});

test("malformed, failed, wrong-item or wrong-quantity quotes cannot pass", () => {
  const window = new Window();
  try {
    for (const changed of [
      [],
      [{ ...evidence().quotes[0], status: 500 }],
      [{ ...evidence().quotes[0], body: null }, evidence().quotes[1]],
      [
        {
          quantity: 1,
          status: 200,
          body: {
            lines: [{ sku: "another", quantity: 1, cents: 1600 }],
            cents: 1600,
            problems: [],
          },
        },
        evidence().quotes[1],
      ],
      [{ ...evidence().quotes[0], quantity: 2 }, evidence().quotes[1]],
      [
        { ...evidence().quotes[0], body: { ...evidence().quotes[0].body, cents: 1 } },
        evidence().quotes[1],
      ],
      [
        { ...evidence().quotes[0], body: { ...evidence().quotes[0].body, problems: [null] } },
        evidence().quotes[1],
      ],
    ])
      assert.throws(() =>
        calculatorEvidence(window.document, { ...evidence(), quotes: changed }, settings),
      );
  } finally {
    window.close();
  }
});
