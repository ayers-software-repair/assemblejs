// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ApiDefinition } from "./api-definition.js";
import type { StreamApi } from "./stream-api.js";

/** Whether an api streams, which is what it declares by having `stream` in place of `handle`. */
export function isStreamApi(api: ApiDefinition): api is StreamApi {
  return "stream" in api;
}
