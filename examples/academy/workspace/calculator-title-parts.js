// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { calculatorTitleValid } from "./calculator-title-valid.js";

/** Read the supported title pair and its original fragments without changing representation. */
export function calculatorTitleParts(source) {
  const labels = [...source.matchAll(/aria-label=(?:"Order estimate"|\{("(?:[^"\\]|\\.)*")\})/g)];
  const headings = [...source.matchAll(/<h2>(?:Order estimate|\{("(?:[^"\\]|\\.)*")\})<\/h2>/g)];
  if (labels.length !== 1 || headings.length !== 1)
    throw new Error(
      "The calculator title has changed shape; inspect the source or use your connected agent.",
    );
  const part = (match) => {
    const value = match[1] === undefined ? "Order estimate" : JSON.parse(match[1]);
    if (!calculatorTitleValid(value))
      throw new Error("The calculator title is outside the supported authored shape.");
    return { value, fragment: match[0] };
  };
  return { label: part(labels[0]), heading: part(headings[0]) };
}
