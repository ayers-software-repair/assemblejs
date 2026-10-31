// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Titles are bounded single-line Unicode text, including when read back from manual source. */
export function calculatorTitleValid(value) {
  return (
    typeof value === "string" &&
    value.length <= 60 &&
    value.trim() !== "" &&
    [...value].every((character) => {
      const code = character.codePointAt(0);
      return (
        code >= 32 &&
        code !== 127 &&
        code !== 8232 &&
        code !== 8233 &&
        !(code >= 55296 && code <= 57343)
      );
    })
  );
}
