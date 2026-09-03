// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { COMPOSITION_HEADER } from "../vocab/composition-header.js";
import type { CompositionHeaders } from "./composition-headers.js";
import type { HeaderProblem } from "./header-problem.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IDENTITY = /^[^,/\s]+\/[^,/\s]+$/;

/**
 * The composition headers, checked on arrival against their declared shape.
 *
 * A malformed value is refused, never coerced to a default. Coercing is how a depth header of
 * "abc" becomes depth 0 and a bounded recursion becomes an unbounded one, and how the refusal
 * that was supposed to stop it reports success instead.
 */
export function readCompositionHeaders(
  headers: Readonly<Record<string, string | undefined>>,
  maxDepth: number,
):
  | { readonly ok: true; readonly headers: CompositionHeaders }
  | { readonly ok: false; readonly problems: readonly HeaderProblem[] } {
  const problems: HeaderProblem[] = [];

  const page = readUuid(headers[COMPOSITION_HEADER.page], COMPOSITION_HEADER.page, problems);
  const id = readUuid(headers[COMPOSITION_HEADER.id], COMPOSITION_HEADER.id, problems);

  const rawDepth = headers[COMPOSITION_HEADER.depth];
  let depth = 0;
  if (rawDepth !== undefined && rawDepth !== "") {
    if (!/^\d+$/.test(rawDepth)) {
      problems.push({ header: COMPOSITION_HEADER.depth, detail: "is not a whole number" });
    } else if (Number(rawDepth) > maxDepth) {
      problems.push({
        header: COMPOSITION_HEADER.depth,
        detail: `is above the cap of ${maxDepth}`,
      });
    } else {
      depth = Number(rawDepth);
    }
  }

  const rawPath = headers[COMPOSITION_HEADER.path];
  let path: readonly string[] = [];
  if (rawPath !== undefined && rawPath !== "") {
    const parts = rawPath.split(",");
    if (parts.length > maxDepth) {
      problems.push({
        header: COMPOSITION_HEADER.path,
        detail: `has more than ${maxDepth} entries`,
      });
    } else if (!parts.every((part) => IDENTITY.test(part))) {
      problems.push({
        header: COMPOSITION_HEADER.path,
        detail: "is not a comma separated list of name/view",
      });
    } else {
      path = parts;
    }
  }

  if (problems.length > 0) return { ok: false, problems };
  return { ok: true, headers: { page, id, depth, path } };
}

function readUuid(
  raw: string | undefined,
  header: string,
  problems: HeaderProblem[],
): string | undefined {
  if (raw === undefined || raw === "") return undefined;
  if (!UUID.test(raw)) {
    problems.push({ header, detail: "is not a uuid" });
    return undefined;
  }
  return raw;
}
