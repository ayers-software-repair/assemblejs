// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Read one supported authored preset fragment; the caller still checks the complete body. */
export function calculatorPresets(source) {
  const pattern = /\{(\[\d+(?:, ?\d+)*\])\.map\(\(value\) => \(/g;
  const matches = [...source.matchAll(pattern)];
  if (matches.length !== 1) throw new Error("The calculator presets have changed shape.");
  const values = JSON.parse(matches[0][1]);
  if (
    values.length < 1 ||
    values.length > 6 ||
    new Set(values).size !== values.length ||
    !values.every((value) => Number.isInteger(value) && value >= 1 && value <= 99)
  )
    throw new Error("The current calculator presets are outside the supported shape.");
  return { values, fragment: matches[0][0] };
}
