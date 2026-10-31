// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { test } from "node:test";
import { calculatorPresets } from "./calculator-presets.js";

test("reads authored values and their exact fragment without normalizing surrounding source", () => {
  const source = "before {[2,4, 8].map((value) => ( after";
  assert.deepEqual(calculatorPresets(source), {
    values: [2, 4, 8],
    fragment: "{[2,4, 8].map((value) => (",
  });
});

test("refuses missing, repeated and unsupported preset fragments", () => {
  for (const source of [
    "unfamiliar source",
    "{[].map((value) => (",
    "{[-1, 3].map((value) => (",
    "{[0, 3].map((value) => (",
    "{[1, 100].map((value) => (",
    "{[1, 1].map((value) => (",
    "{[1, 2, 3, 4, 5, 6, 7].map((value) => (",
    "{[01].map((value) => (",
    "{[1, 3, 6].map((value) => (\n// {[2, 4, 8].map((value) => (",
  ])
    assert.throws(() => calculatorPresets(source));
});
