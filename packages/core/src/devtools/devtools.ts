// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { DevtoolsRoute } from "./devtools-route.js";

/**
 * What a devtools package hands the server: its routes. The server mounts them under the
 * devtools prefix in development, and in production mounts nothing of them.
 */
export interface Devtools {
  readonly routes: readonly DevtoolsRoute[];
}
