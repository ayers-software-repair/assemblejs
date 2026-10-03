// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { DevtoolsAnswer } from "./devtools-answer.js";
import type { DevtoolsView } from "./devtools-view.js";

/**
 * One page or file devtools serve, at a path under the devtools prefix. Reading only: a route
 * answers GET from what it is shown, and changes nothing.
 */
export interface DevtoolsRoute {
  readonly method: "GET";
  /** Under the devtools prefix: `/` is the prefix itself. */
  readonly path: string;
  respond(view: DevtoolsView): DevtoolsAnswer | Promise<DevtoolsAnswer>;
}
