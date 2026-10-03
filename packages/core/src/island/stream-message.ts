// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonValue } from "../json/json-value.js";

/**
 * One message a page's stream carries, as the server writes it and the browser runtime reads it:
 * a topic and a payload for the page's bus, and the assemblies it is for, by name, when it is
 * not for every one.
 */
export interface StreamMessage {
  readonly topic: string;
  readonly payload: JsonValue;
  readonly to?: { readonly name: string };
}
