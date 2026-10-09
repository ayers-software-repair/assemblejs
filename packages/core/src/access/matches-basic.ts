// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createHash, timingSafeEqual } from "node:crypto";
import type { AuthConfig } from "../config/auth-config.js";

// Digests are compared, not the strings, so the comparison takes the same time whatever the
// lengths: how long a wrong guess takes says nothing about the right one.
const same = (given: string, expected: string): boolean =>
  timingSafeEqual(
    createHash("sha256").update(given).digest(),
    createHash("sha256").update(expected).digest(),
  );

/** Whether an authorization header carries exactly the configured basic credentials. */
export function matchesBasic(header: string | undefined, credentials: AuthConfig): boolean {
  if (header === undefined || !/^basic /i.test(header)) return false;
  const decoded = Buffer.from(header.slice("basic ".length).trim(), "base64").toString("utf8");
  const at = decoded.indexOf(":");
  if (at === -1) return false;
  const user = same(decoded.slice(0, at), credentials.user);
  const password = same(decoded.slice(at + 1), credentials.password);
  return user && password;
}
