// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { calculatorPresets } from "./calculator-presets.js";
import { calculatorTitleParts } from "./calculator-title-parts.js";

/** The guided writer owns only the authored body/settings; unfamiliar executable edits refuse. */
export function calculatorShape(source, template) {
  if (typeof template !== "string" || template === "")
    throw new Error("missing authored calculator view");
  const presets = calculatorPresets(source);
  const title = calculatorTitleParts(source);
  const authoredPresets = calculatorPresets(template);
  const authoredTitle = calculatorTitleParts(template);
  const actual = source
    .replace(title.label.fragment, () => authoredTitle.label.fragment)
    .replace(title.heading.fragment, () => authoredTitle.heading.fragment)
    .replace(presets.fragment, () => authoredPresets.fragment);
  const authored = template;
  const suffix = actual.slice(authored.length);
  if (
    !actual.startsWith(authored) ||
    !suffix.split(/\r\n?|\n/).every((line) => /^[ \t]*(?:\/\/[^\u2028\u2029]*)?$/.test(line))
  )
    throw new Error(
      "The calculator has unfamiliar manual code. Guided changes preserve authored settings and trailing line comments; use your agent for other edits.",
    );
}
