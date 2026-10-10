// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";

// The view its template places itself with comes from here, so no source says which it is:
// boot holds the placement for its name alone, and only a render finds where it leads.
export default defineService({
  name: "loop",
  schema: { properties: { view: { type: "string" } }, required: ["view"] },
  run: () => ({ view: "default" }),
});
