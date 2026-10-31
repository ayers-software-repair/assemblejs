// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { calculatorTitleValid } from "./calculator-title-valid.js";

/** Authored requests only; unsupported prose never becomes invented code or a tool call. */
export function calculatorRequest(text) {
  if (typeof text !== "string" || text.length > 200)
    throw new Error(
      'Use Add a calculator, Rename calculator to "Your title", or Use presets 1, 3, 6.',
    );
  const request = text.trim();
  const addition =
    /^add (?:a )?(?:price )?calculator(?: (?:called|titled) "([^"\r\n]{1,60})")?[.!]?$/i.exec(
      request,
    );
  if (addition && (!addition[1] || calculatorTitleValid(addition[1])))
    return Object.freeze({ action: "add", ...(addition[1] ? { title: addition[1].trim() } : {}) });
  const title =
    /^(?:rename|call) (?:the )?(?:price )?calculator (?:to )?"([^"\r\n]{1,60})"[.!]?$/i.exec(
      request,
    );
  if (title && calculatorTitleValid(title[1]))
    return Object.freeze({ action: "title", title: title[1].trim() });
  const presets = /^(?:use|set) (?:quantity )?presets(?: to)? ([0-9, ]+)[.!]?$/i.exec(request);
  if (presets) {
    const values = presets[1].split(",").map((value) => Number(value.trim()));
    if (
      values.length >= 1 &&
      values.length <= 6 &&
      new Set(values).size === values.length &&
      values.every((value) => Number.isInteger(value) && value >= 1 && value <= 99)
    )
      return Object.freeze({ action: "presets", values: Object.freeze(values) });
  }
  throw new Error(
    'Guided requests: Add a calculator; Rename calculator to "Your title"; Use presets 1, 3, 6. Use your connected agent for other changes.',
  );
}
