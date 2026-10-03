// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { DevtoolsRoute } from "@assemblejs/core";

/** The same reading as JSON, for a tool or an agent rather than a person. */
export const projectRoute: DevtoolsRoute = {
  method: "GET",
  path: "/project.json",
  respond: (view) => ({
    type: "application/json; charset=utf-8",
    body: JSON.stringify({ project: view.project, failures: view.failures() }),
  }),
};
