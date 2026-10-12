// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** What an outline says of one assembly on a page: where it came from, and when. */
export interface EnvelopeFacts {
  /** The assembly's name, and its view where that is not the default. */
  readonly name: string;
  /**
   * What answered, which is the colour its box is drawn in: this server, another server, an
   * answer that was kept, a fallback, the browser after the page loaded, or `inner` for an
   * assembly that arrived inside another's answer and has no account of its own.
   */
  readonly tone: "local" | "remote" | "cache" | "fallback" | "deferred" | "inner";
  /** A few words for the chip beside the name. */
  readonly brief: string;
  /** Every fact, as what it is called and what it says, in the order it is shown. */
  readonly rows: readonly (readonly [string, string])[];
}
