// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * One cookie an api sets: its value and the attributes of RFC 6265 section 4.1.1, with
 * `SameSite`, which that RFC predates (MDN, Set-Cookie).
 */
export interface CookieOptions {
  readonly value: string;
  readonly path?: string;
  readonly domain?: string;
  /** Seconds until the cookie expires. */
  readonly maxAge?: number;
  readonly expires?: Date;
  readonly secure?: boolean;
  /** Hidden from the page's own script. */
  readonly httpOnly?: boolean;
  readonly sameSite?: "strict" | "lax" | "none";
}
