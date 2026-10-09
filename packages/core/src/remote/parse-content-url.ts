// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { ASSEMBLY_ROUTE_PREFIX } from "../vocab/assembly-route-prefix.js";
import { DEFAULT_VIEW } from "../vocab/default-view.js";
import { SEGMENT_PATTERN } from "../vocab/segment-pattern.js";
import type { ContentUrl } from "./content-url.js";

const PATH = new RegExp(
  `^${ASSEMBLY_ROUTE_PREFIX}/(${SEGMENT_PATTERN})/(?:(${SEGMENT_PATTERN})/)?$`,
);

/**
 * A placement's url, read as the content endpoint of an assembly on another server, or undefined
 * when it is not one: an http or https origin and the contract's own path, with no query, no
 * fragment and no credentials. Anything else would be a url the contract does not describe.
 */
export function parseContentUrl(url: string): ContentUrl | undefined {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return undefined;
  if (
    parsed.username !== "" ||
    parsed.password !== "" ||
    parsed.search !== "" ||
    parsed.hash !== ""
  ) {
    return undefined;
  }
  const match = PATH.exec(parsed.pathname);
  if (match === null) return undefined;
  const name = match[1] ?? "";
  const view = match[2] ?? DEFAULT_VIEW;
  return {
    origin: parsed.origin,
    name,
    view,
    content: url,
    manifest: `${parsed.origin}${ASSEMBLY_ROUTE_PREFIX}/${name}/${view}/manifest/`,
  };
}
