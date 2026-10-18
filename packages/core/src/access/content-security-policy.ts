// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The default content security policy for a page: what a page loads, from this origin and from
 * the declared remotes, which are the only other origins a composed page is designed to load
 * from, and nothing inline but the data islands, which are not scripts a browser runs. What it
 * connects to is this origin alone: a remote's browser half reaches its own server through this
 * one's relay. No plugins, no framing by another origin, no base tag pointing elsewhere.
 */
export function contentSecurityPolicy(remotes: readonly string[]): string {
  const from = ["'self'", ...remotes].join(" ");
  return [
    "default-src 'self'",
    `script-src ${from}`,
    `style-src ${from}`,
    "connect-src 'self'",
    `img-src ${from} data:`,
    `font-src ${from}`,
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'self'",
    "form-action 'self'",
  ].join("; ");
}
