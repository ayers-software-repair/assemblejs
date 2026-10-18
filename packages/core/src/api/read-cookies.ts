// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const decode = (text: string): string => {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
};

/**
 * The cookies a request carried, by name. The header is `cookie-pair *( ";" SP cookie-pair )`
 * (RFC 6265 section 4.2.1); each pair is split at its first `=`, trimmed and percent-decoded,
 * and a value that does not decode is kept as written. A name sent twice is the first one. A
 * pair without a name or without an `=` is dropped. The result has no prototype, so a cookie
 * named `constructor` is a cookie and nothing else.
 */
export function readCookies(header: string | undefined): Readonly<Record<string, string>> {
  const cookies: Record<string, string> = Object.create(null) as Record<string, string>;
  for (const pair of (header ?? "").split(";")) {
    const at = pair.indexOf("=");
    const name = at === -1 ? "" : pair.slice(0, at).trim();
    if (name === "" || name in cookies) continue;
    cookies[name] = decode(pair.slice(at + 1).trim());
  }
  return cookies;
}
