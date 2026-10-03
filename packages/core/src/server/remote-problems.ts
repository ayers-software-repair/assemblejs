// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { RemoteDefinition } from "../remote/remote-definition.js";

const HEADER = /^[a-z0-9!#$%&'*+.^_`|~-]+$/;

const isExactOrigin = (origin: string): boolean => {
  try {
    const url = new URL(origin);
    return (url.protocol === "https:" || url.protocol === "http:") && url.origin === origin;
  } catch {
    return false;
  }
};

/**
 * Everything wrong with the declared remotes, found before anything listens: an origin that is
 * not exactly an http or https origin (no path, no credentials, no trailing slash, so the
 * allowlist compares like with like), one declared twice, and a forwarded key that is not a
 * lower-case header name, which would never match the request header it was meant to pass on.
 */
export function remoteProblems(remotes: readonly RemoteDefinition[]): readonly string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const remote of remotes) {
    const exact = isExactOrigin(remote.origin);
    if (!exact) {
      problems.push(
        `remote "${remote.origin}" is not an origin; write it as https://host or https://host:port`,
      );
    }
    if (seen.has(remote.origin))
      problems.push(`remote "${remote.origin}" is declared more than once`);
    seen.add(remote.origin);
    for (const key of remote.forward ?? []) {
      if (!HEADER.test(key)) {
        problems.push(
          `remote "${remote.origin}" forwards "${key}", which is not a lower-case header name`,
        );
      }
    }
  }
  return problems;
}
