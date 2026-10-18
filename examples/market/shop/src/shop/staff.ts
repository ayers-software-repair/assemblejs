// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { timingSafeEqual } from "node:crypto";

// The one thing staff know. A showcase's sign-in, said plainly: the framework ships no user
// store and no session, so a product brings its own, and this one is a single shared key from
// the environment, kept in a cookie the sign-in api sets. A real shop would put its own sessions behind the same
// check.
const KEY = process.env["STAFF_KEY"] ?? "";

/** Whether what was offered is the staff key. Never true while no key is set. */
export const isStaffKey = (offered: string | undefined): boolean => {
  if (KEY === "" || offered === undefined) return false;
  const one = Buffer.from(offered);
  const other = Buffer.from(KEY);
  return one.length === other.length && timingSafeEqual(one, other);
};

/** The addresses only staff reach: the stock board, wherever it is shown, and the api behind it. */
export const forStaff = (path: string): boolean =>
  path.startsWith("/staff/stock") ||
  path.startsWith("/assembly/stock-board") ||
  path === "/api/restock";
