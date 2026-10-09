// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";

// A title with markup in it, which the template writes escaped.
export default defineService({
  name: "card",
  schema: {
    properties: { title: { type: "string" }, items: { type: "array", items: { type: "string" } } },
    required: ["title", "items"],
  },
  run: () => ({ title: "Written in ejs <em>escaped</em>", items: ["one", "two"] }),
});
