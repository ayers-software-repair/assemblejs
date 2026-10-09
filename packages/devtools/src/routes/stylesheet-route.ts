// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { DevtoolsRoute } from "@assemblejs/core";
import { OVERVIEW_STYLESHEET } from "../overview/overview-stylesheet.js";

/** The overview's stylesheet. */
export const stylesheetRoute: DevtoolsRoute = {
  method: "GET",
  path: "/devtools.css",
  respond: () => ({ type: "text/css; charset=utf-8", body: OVERVIEW_STYLESHEET }),
};
