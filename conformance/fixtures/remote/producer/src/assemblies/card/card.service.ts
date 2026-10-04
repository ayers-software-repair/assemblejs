// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";

// What the producer renders, for a page on another server to place.
export default defineService({
  name: "card",
  schema: { properties: { label: { type: "string" } }, required: ["label"] },
  run: () => ({ label: "rendered by the producer" }),
});
