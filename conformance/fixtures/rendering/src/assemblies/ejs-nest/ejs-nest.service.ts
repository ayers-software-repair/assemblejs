// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";

// A service shapes what its view places: which view of the child, never which child.
export default defineService({
  name: "ejs-nest",
  schema: { properties: { view: { type: "string" } }, required: ["view"] },
  run: () => ({ view: "default" }),
});
