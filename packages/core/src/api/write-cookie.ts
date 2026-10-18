// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { CookieOptions } from "./cookie-options.js";

const SAME_SITE = { strict: "Strict", lax: "Lax", none: "None" } as const;

const attribute = (name: string, text: string): string => {
  if (/[;\r\n]/.test(text)) throw new Error(`A cookie's ${name} may not hold ";" or a line break`);
  return `${name}=${text}`;
};

/**
 * One `Set-Cookie` header value (RFC 6265 section 4.1.1): `name=value`, then the attributes
 * given, in the order Path, Domain, Max-Age, Expires, Secure, HttpOnly, SameSite (the last is
 * from MDN, not the RFC). The name and value are percent-encoded, which `readCookies` undoes.
 */
export function writeCookie(name: string, cookie: CookieOptions): string {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(cookie.value)}`];
  if (cookie.path !== undefined) parts.push(attribute("Path", cookie.path));
  if (cookie.domain !== undefined) parts.push(attribute("Domain", cookie.domain));
  if (cookie.maxAge !== undefined) parts.push(`Max-Age=${Math.trunc(cookie.maxAge)}`);
  if (cookie.expires !== undefined) parts.push(`Expires=${cookie.expires.toUTCString()}`);
  if (cookie.secure === true) parts.push("Secure");
  if (cookie.httpOnly === true) parts.push("HttpOnly");
  if (cookie.sameSite !== undefined) parts.push(`SameSite=${SAME_SITE[cookie.sameSite]}`);
  return parts.join("; ");
}
