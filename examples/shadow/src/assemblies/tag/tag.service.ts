// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";

// Reads the page's route parameter, so a deferred fill is seen to carry it.
export default defineService({
  name: "tag",
  schema: { properties: { sku: { type: "string" } }, required: ["sku"] },
  run: ({ params }) => ({ sku: params["sku"] ?? "none" }),
});
