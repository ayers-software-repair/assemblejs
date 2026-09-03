// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject } from "../json/json-object.js";

/** What a projection may be built from. Anything wider than this is simply not read. */
export interface IslandSource {
  readonly id: string;
  readonly name: string;
  readonly view: string;
  readonly renderer: string;
  readonly data: JsonObject;
  readonly deferred?: boolean;
}
