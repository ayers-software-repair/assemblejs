// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";

export default defineService({
  name: "badge",
  schema: { properties: { tier: { type: "string" } }, required: ["tier"] },
  run: () => ({ tier: "member" }),
});
