// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { DataApi } from "./data-api.js";
import type { StreamApi } from "./stream-api.js";

/**
 * A route that serves data to anyone: answering each request with data, or holding the response
 * open as a stream. One method per definition; a definition that answered several methods would
 * need a router inside it, and the router already exists one level up.
 */
export type ApiDefinition = DataApi | StreamApi;
