// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Devtools } from "@assemblejs/core";
import { overviewRoute } from "../routes/overview-route.js";
import { projectRoute } from "../routes/project-route.js";
import { stylesheetRoute } from "../routes/stylesheet-route.js";

/**
 * The devtools a server is handed: an overview page, its stylesheet and the same reading as
 * JSON, all read-only. The server mounts them in development and ignores them in production, so
 * a project can hand them over unconditionally.
 */
export function devtools(): Devtools {
  return { routes: [overviewRoute, stylesheetRoute, projectRoute] };
}
