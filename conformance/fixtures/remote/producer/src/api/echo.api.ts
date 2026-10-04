// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineApi } from "@assemblejs/core";

// Answers what it was sent, so a spec can see a body arrive as JSON and leave as JSON.
export default defineApi({
  path: "/api/echo",
  method: "POST",
  handle: ({ body }) => ({ received: body ?? null }),
});
