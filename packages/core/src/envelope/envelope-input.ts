// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject } from "../json/json-object.js";

/** Everything the envelope is built from. */
export interface EnvelopeInput {
  readonly id: string;
  readonly name: string;
  readonly view: string;
  readonly renderer: string;
  /**
   * The assembly's own markup, already rendered. It is HTML by contract and is the single value
   * in this whole boundary that is inserted verbatim; everything else passes an encoder.
   */
  readonly markup: string;
  readonly data: JsonObject;
  /** The origin, when this assembly was served by another server. */
  readonly remote?: string;
  /** The content has not been fetched yet; the browser fills it after load. */
  readonly deferred?: boolean;
  /** The render or the fetch failed and this is a fallback. */
  readonly failed?: boolean;
}
