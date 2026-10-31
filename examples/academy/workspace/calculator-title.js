// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { calculatorTitleParts } from "./calculator-title-parts.js";
import { calculatorTitleValid } from "./calculator-title-valid.js";

/** Transform only a changed title pair; preserve every other byte of current source. */
export function calculatorTitle(source, title) {
  if (!calculatorTitleValid(title)) throw new Error("unsupported calculator title");
  const { label, heading } = calculatorTitleParts(source);
  if (label.value === title && heading.value === title) return source;
  const value = JSON.stringify(title).replaceAll("<", "\\u003c");
  return source
    .replace(label.fragment, () => `aria-label={${value}}`)
    .replace(heading.fragment, () => `<h2>{${value}}</h2>`);
}
