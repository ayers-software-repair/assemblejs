// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonValue } from "./json-value.js";

/** A JSON object, which is the only shape that crosses the server-to-browser boundary. */
export type JsonObject = { [key: string]: JsonValue };
