// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineApi } from "@assemblejs/core";

// Reads a body, so a spec can see that the access decision comes before the body is read.
export default defineApi({
  path: "/api/submit",
  method: "POST",
  handle: ({ body }) => ({ received: body ?? null }),
});
