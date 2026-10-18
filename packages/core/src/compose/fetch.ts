// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyRequest } from "./assembly-request.js";
import type { AssemblyResponse } from "./assembly-response.js";

/**
 * The one way to reach an assembly. A local assembly is rendered in process and a remote one is
 * fetched over HTTP, and both come through here, so moving an assembly to another server changes
 * a URL and nothing else.
 *
 * It returns a result, and rejects only with the `NotFound` a local service threw.
 */
export type Fetch = (request: AssemblyRequest) => Promise<AssemblyResponse>;
