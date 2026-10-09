// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { DevtoolsView, LogLine } from "@assemblejs/core";

/** A view of a small project, its text chosen to show whether the overview escapes it. */
export const view = (failures: readonly LogLine[] = []): DevtoolsView => ({
  project: {
    mode: "development",
    version: "dev",
    assemblies: [
      {
        name: "cart",
        views: [{ name: "default", renderer: "react" }],
        mount: "load",
        shadow: false,
      },
    ],
    pages: [{ route: "/", stream: "/api/prices" }],
    apis: [{ method: "GET", path: "/api/prices", streams: true }],
    remotes: [{ origin: "https://shop.example.com" }],
  },
  failures: () => failures,
});
