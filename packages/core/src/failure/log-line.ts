// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** One line for the log, pairing the id the visitor was given with what actually happened. */
export interface LogLine {
  readonly correlationId: string;
  readonly message: string;
  readonly stack: string | undefined;
}
