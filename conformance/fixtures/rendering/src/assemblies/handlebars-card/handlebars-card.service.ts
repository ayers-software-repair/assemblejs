// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";

// Data with markup in it, which the view must write escaped.
export default defineService({
  name: "handlebars-card",
  schema: {
    properties: { title: { type: "string" }, items: { type: "array", items: { type: "string" } } },
    required: ["title", "items"],
  },
  run: () => ({ title: "<em>handlebars</em>", items: ["one", "two"] }),
});
