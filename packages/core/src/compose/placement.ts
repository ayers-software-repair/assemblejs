// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** One placement found in a template, and where it sits in the template's text. */
export interface Placement {
  readonly name: string;
  readonly view: string;
  /** Index of the first character of the directive. */
  readonly start: number;
  /** Index one past the last character of the directive. */
  readonly end: number;
}
