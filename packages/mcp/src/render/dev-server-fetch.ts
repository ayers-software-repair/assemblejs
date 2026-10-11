// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { ASSEMBLY_ROUTE_PREFIX, COMPOSITION_HEADER, encodeParams } from "@assemblejs/core";
import type { Fetch } from "@assemblejs/core";

/**
 * The composer's transport for a project whose dev server runs: every placement is asked of
 * that server's content endpoint, with the composition headers a page's composer sends, so
 * what an agent is shown is what the project itself serves, framework views included, and
 * nothing of the project's code runs here. Any answer but html under a 2xx is a failure the
 * composer's ladder covers for, as it covers for a remote's.
 */
export function devServerFetch(url: string): Fetch {
  return async (request) => {
    const headers: Record<string, string> = {
      accept: "text/html",
      [COMPOSITION_HEADER.page]: request.page,
      [COMPOSITION_HEADER.id]: request.id,
      [COMPOSITION_HEADER.depth]: String(request.depth),
    };
    if (request.path.length > 0) headers[COMPOSITION_HEADER.path] = request.path.join(",");
    const params = encodeParams(request.params);
    if (params !== "") headers[COMPOSITION_HEADER.params] = params;
    const search = request.query.toString();
    const at = `${url}${ASSEMBLY_ROUTE_PREFIX}/${request.name}/${request.view}/${search === "" ? "" : `?${search}`}`;
    let response: Response;
    try {
      response = await fetch(at, { headers, signal: request.signal });
    } catch (error) {
      return {
        ok: false,
        reason: "transport",
        detail: error instanceof Error ? error.message : String(error),
        correlationId: "",
      };
    }
    const type = response.headers.get("content-type") ?? "";
    const html = await response.text();
    if (!response.ok) {
      return {
        ok: false,
        reason: "status",
        detail: `${at} answered ${String(response.status)}`,
        correlationId: "",
      };
    }
    if (!type.startsWith("text/html")) {
      return {
        ok: false,
        reason: "content-type",
        detail: `${at} answered ${type || "no content type"}`,
        correlationId: "",
      };
    }
    return { ok: true, html, source: "remote" };
  };
}
