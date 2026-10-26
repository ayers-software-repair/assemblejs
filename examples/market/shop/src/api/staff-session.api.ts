// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineApi, reply } from "@asmjs/core";
import { isStaffKey } from "../shop/staff.js";

// Answers whether a key is the staff key. On a yes the api itself sets the session cookie,
// HttpOnly so the page's script can never read the key back; the shop's access check
// (assemblejs.config.ts) reads it on every request for a guarded address.
export default defineApi({
  path: "/api/staff/session",
  method: "POST",
  handle: ({ body }) => {
    const key = typeof body === "object" && body !== null && "key" in body ? body.key : undefined;
    if (typeof key !== "string" || !isStaffKey(key)) return { ok: false };
    return reply({
      cookies: { staff: { value: key, path: "/", httpOnly: true, sameSite: "strict" } },
      body: { ok: true },
    });
  },
});
