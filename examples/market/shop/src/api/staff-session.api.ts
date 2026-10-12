// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineApi } from "@assemblejs/core";
import { isStaffKey } from "../shop/staff.js";

// Answers whether a key is the staff key. The browser keeps it in a cookie if so; an api sets
// no header of its own, so the page's own script writes the cookie.
export default defineApi({
  path: "/api/staff/session",
  method: "POST",
  handle: ({ body }) => {
    const key = typeof body === "object" && body !== null && "key" in body ? body.key : undefined;
    return { ok: isStaffKey(typeof key === "string" ? key : undefined) };
  },
});
