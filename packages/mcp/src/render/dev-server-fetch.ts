// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { ASSEMBLY_ROUTE_PREFIX, COMPOSITION_HEADER, encodeParams } from "@assemblejs/core";
import type { Fetch, LogLine } from "@assemblejs/core";
import { failedEnvelopes } from "./failed-envelopes.js";

/**
 * The composer's transport for a project whose dev server runs: every placement is asked of
 * that server's content endpoint, with the composition headers a page's composer sends, so
 * what an agent is shown is what the project itself serves, framework views included, and
 * nothing of the project's code runs here. Any answer but html under a 2xx is a failure the
 * composer's ladder covers for, as it covers for a remote's.
 *
 * What went wrong on that server is in its log, under an id its markup carries: a failed
 * assembly answers its fallback envelope marked with one, and an answer that stands holds one
 * for each placement that fell back inside it. So a failure is answered with the server's own
 * id and said to `failed`, which the composer's account then finds it by; and each placement
 * that fell back inside an answer is said to `inside`, since no account here holds it.
 */
export function devServerFetch(
  url: string,
  failed: (line: LogLine) => void = () => undefined,
  inside: (problem: string) => void = () => undefined,
): Fetch {
  const logged = (id: string): string =>
    id === "" ? "its log says why" : `its log says why, against ${id}`;
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
      // The assembly's own fallback envelope, with the id its failure is logged against there.
      const own = failedEnvelopes(html).find((one) => one.name === request.name);
      if (own !== undefined) {
        failed({
          correlationId: own.id,
          message: `"${request.name}" failed on the dev server, which answered ${String(response.status)}: ${logged(own.id)}`,
          stack: undefined,
        });
      }
      return {
        ok: false,
        reason: "status",
        detail: `${at} answered ${String(response.status)}`,
        correlationId: own?.id ?? "",
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
    for (const one of failedEnvelopes(html)) {
      inside(
        `"${one.name}" fell back inside "${request.name}" on the dev server: ${logged(one.id)}`,
      );
    }
    return { ok: true, html, source: "remote" };
  };
}
