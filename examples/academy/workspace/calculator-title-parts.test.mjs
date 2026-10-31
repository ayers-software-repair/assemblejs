// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { test } from "node:test";
import { calculatorTitleParts } from "./calculator-title-parts.js";

test("reads default and escaped title values while retaining exact source fragments", () => {
  assert.deepEqual(calculatorTitleParts('aria-label="Order estimate" <h2>Order estimate</h2>'), {
    label: { value: "Order estimate", fragment: 'aria-label="Order estimate"' },
    heading: { value: "Order estimate", fragment: "<h2>Order estimate</h2>" },
  });
  const source = 'aria-label={"Coff\\u0065e total"} <h2>{"Coffee total"}</h2>';
  const parts = calculatorTitleParts(source);
  assert.equal(parts.label.value, "Coffee total");
  assert.equal(parts.heading.value, "Coffee total");
  assert.equal(parts.label.fragment, 'aria-label={"Coff\\u0065e total"}');
});

test("refuses missing, repeated and unsupported title pairs", () => {
  for (const source of [
    "",
    'aria-label="Order estimate"',
    'aria-label={""} <h2>Order estimate</h2>',
    'aria-label="Order estimate" <h2>{"bad\\nlabel"}</h2>',
    'aria-label="Order estimate" <h2>Order estimate</h2> // <h2>Order estimate</h2>',
  ])
    assert.throws(() => calculatorTitleParts(source));
});
