// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { DevtoolsRoute } from "@assemblejs/core";
import { renderOverview } from "../overview/render-overview.js";

/** The overview page, at the devtools prefix itself. */
export const overviewRoute: DevtoolsRoute = {
  method: "GET",
  path: "/",
  respond: (view) => ({ type: "text/html; charset=utf-8", body: renderOverview(view) }),
};
