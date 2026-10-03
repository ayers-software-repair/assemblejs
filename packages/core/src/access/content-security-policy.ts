// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The default content security policy for a page: everything from this origin and from the
 * declared remotes, which are the only other origins a composed page is designed to load from,
 * and nothing inline but the data islands, which are not scripts a browser runs. No plugins, no
 * framing by another origin, no base tag pointing elsewhere.
 */
export function contentSecurityPolicy(remotes: readonly string[]): string {
  const from = ["'self'", ...remotes].join(" ");
  return [
    "default-src 'self'",
    `script-src ${from}`,
    `style-src ${from}`,
    `connect-src ${from}`,
    `img-src ${from} data:`,
    `font-src ${from}`,
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'self'",
    "form-action 'self'",
  ].join("; ");
}
