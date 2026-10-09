// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";

// Reads nothing of the request, so anything of the request found in the island got there by
// the server and not by this service.
export default defineService({
  name: "greeting",
  schema: { properties: { audience: { type: "string" } }, required: ["audience"] },
  run: () => ({ audience: "everyone" }),
});
