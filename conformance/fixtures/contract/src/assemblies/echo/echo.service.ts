// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";

// What a page's route parameters look like from inside an assembly: a service is given them.
export default defineService({
  name: "echo",
  schema: {
    properties: { sku: { type: "string" }, given: { type: "array" } },
    required: ["sku", "given"],
  },
  run: ({ params }) => ({ sku: params["sku"] ?? "none", given: Object.keys(params).sort() }),
});
