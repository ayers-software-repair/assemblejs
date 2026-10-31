// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { calculatorTitle } from "./calculator-title.js";

/** The guided writer owns only the authored body/settings; unfamiliar executable edits refuse. */
export function calculatorShape(source, template) {
  if (typeof template !== "string" || template === "")
    throw new Error("missing authored calculator view");
  const normalize = (text) => {
    const presets = /\{(\[\d+(?:, ?\d+)*\])\.map\(\(value\) => \(/g;
    const matches = [...text.matchAll(presets)];
    if (matches.length !== 1) throw new Error("The calculator presets have changed shape.");
    const values = JSON.parse(matches[0][1]);
    if (
      values.length < 1 ||
      values.length > 6 ||
      new Set(values).size !== values.length ||
      !values.every((value) => Number.isInteger(value) && value >= 1 && value <= 99)
    )
      throw new Error("The current calculator presets are outside the supported shape.");
    return calculatorTitle(text, "Order estimate").replace(presets, "{[1, 3, 6].map((value) => (");
  };
  const actual = normalize(source);
  const authored = normalize(template);
  const suffix = actual.slice(authored.length);
  if (
    !actual.startsWith(authored) ||
    !suffix.split(/\r\n?|\n/).every((line) => /^[ \t]*(?:\/\/[^\u2028\u2029]*)?$/.test(line))
  )
    throw new Error(
      "The calculator has unfamiliar manual code. Guided changes preserve authored settings and trailing line comments; use your agent for other edits.",
    );
}
