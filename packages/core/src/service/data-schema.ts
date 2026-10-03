// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject } from "../json/json-object.js";

/**
 * The shape of the data a service returns, or a view adds: the fields it provides, each with
 * its own JSON Schema, and which of them are always present.
 *
 * Optional. A view whose services declare schemas has a composed schema, and a field two of
 * them both claim is refused at boot rather than settled by whichever ran last.
 */
export interface DataSchema {
  readonly properties: Readonly<Record<string, JsonObject>>;
  readonly required?: readonly string[];
}
