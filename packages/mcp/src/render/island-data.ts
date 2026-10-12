// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { ISLAND_ATTRIBUTE, ISLAND_SCRIPT_TYPE, escapeAttribute } from "@assemblejs/core";
import type { JsonObject } from "@assemblejs/core";

/**
 * The data an envelope's island carries, read from served markup by the envelope's id: what the
 * assembly's services returned on the server that rendered it. The island is found by the
 * opening the server writes it with, and ends at the first end of a script, which its encoding
 * never holds. Empty where the markup has no island by that id, or one that is not its payload.
 */
export function islandData(html: string, id: string): JsonObject {
  const opening = `<script type="${ISLAND_SCRIPT_TYPE}" ${ISLAND_ATTRIBUTE}="${escapeAttribute(id)}">`;
  const from = html.indexOf(opening);
  const to = from === -1 ? -1 : html.indexOf("</script>", from);
  if (to === -1) return {};
  try {
    const payload: unknown = JSON.parse(html.slice(from + opening.length, to));
    const data =
      typeof payload === "object" && payload !== null && "data" in payload
        ? payload.data
        : undefined;
    return typeof data === "object" && data !== null && !Array.isArray(data)
      ? (data as JsonObject)
      : {};
  } catch {
    return {};
  }
}
