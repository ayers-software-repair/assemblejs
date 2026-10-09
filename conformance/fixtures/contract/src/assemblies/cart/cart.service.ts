// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";

// Data with markup in it, which the island must carry without ending its own script element.
export default defineService({
  name: "cart",
  schema: {
    properties: { items: { type: "number" }, note: { type: "string" } },
    required: ["items", "note"],
  },
  run: () => ({ items: 2, note: "</script><b>bold</b>" }),
});
