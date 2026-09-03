// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Diagnostic } from "./diagnostic.js";

/**
 * Thrown when a placement declared required did not answer. It is the only way a page dies from
 * one of its children, and it carries the diagnostic so the page's own failure names the cause.
 */
export class RequiredFailure extends Error {
  readonly diagnostic: Diagnostic;

  constructor(diagnostic: Diagnostic) {
    super(
      `required assembly "${diagnostic.name}" did not answer: ${diagnostic.reason ?? "unknown"}`,
    );
    this.name = "RequiredFailure";
    this.diagnostic = diagnostic;
  }
}
