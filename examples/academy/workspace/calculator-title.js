// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { calculatorTitleValid } from "./calculator-title-valid.js";

/** Transform only the known title pair; preserve every other byte of current source. */
export function calculatorTitle(source, title) {
  if (!calculatorTitleValid(title)) throw new Error("unsupported calculator title");
  const label = /aria-label=(?:"Order estimate"|\{("(?:[^"\\]|\\.)*")\})/g;
  const heading = /<h2>(?:Order estimate|\{("(?:[^"\\]|\\.)*")\})<\/h2>/g;
  const labels = [...source.matchAll(label)];
  const headings = [...source.matchAll(heading)];
  if (labels.length !== 1 || headings.length !== 1)
    throw new Error(
      "The calculator title has changed shape; inspect the source or use your connected agent.",
    );
  for (const match of [...labels, ...headings]) {
    if (match[1] === undefined) continue;
    const previous = JSON.parse(match[1]);
    if (!calculatorTitleValid(previous))
      throw new Error("The calculator title is outside the supported authored shape.");
  }
  const value = JSON.stringify(title).replaceAll("<", "\\u003c");
  return source
    .replace(label, () => `aria-label={${value}}`)
    .replace(heading, () => `<h2>{${value}}</h2>`);
}
