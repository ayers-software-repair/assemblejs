// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";

// Renders the parameter a page on another server was asked with, which crossed as a header.
export default defineService({
  name: "tag",
  schema: { properties: { sku: { type: "string" } }, required: ["sku"] },
  run: ({ params }) => ({ sku: params["sku"] ?? "none" }),
});
