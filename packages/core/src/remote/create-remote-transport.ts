// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { AssemblyAssets } from "../assembly/assembly-assets.js";
import type { AssemblyResponse } from "../compose/assembly-response.js";
import type { FailureReason } from "../compose/failure-reason.js";
import type { LogLine } from "../failure/log-line.js";
import { newCorrelationId } from "../failure/new-correlation-id.js";
import { COMPOSITION_HEADER } from "../vocab/composition-header.js";
import { isPrivateAddress } from "./is-private-address.js";
import { markRemote } from "./mark-remote.js";
import { parseContentUrl } from "./parse-content-url.js";
import { readCapped } from "./read-capped.js";
import type { RemoteDefinition } from "./remote-definition.js";
import type { RemoteTransport } from "./remote-transport.js";

/**
 * The transport for assemblies on other servers, with every rule of DESIGN 5.1 applied here and
 * nowhere else.
 *
 * Only a declared origin is reached, matched exactly; redirects are refused, because a redirect
 * leaves the allowlist after it was checked; a host whose address resolves inside the server's
 * own network is refused unless that origin was declared as an address itself. Nothing of the
 * visitor's request is sent but the composition headers and the keys the remote declared. The
 * answer must be one envelope of text/html under the cap; the remote's response headers go no
 * further than here. The manifest is read once per version of the remote's output, and a
 * manifest that cannot be read is a logged warning and a retry, never a failed placement.
 */
export function createRemoteTransport(options: {
  readonly remotes: readonly RemoteDefinition[];
  readonly maxBytes: number;
  readonly log: (line: LogLine) => void;
  /** Every address a host resolves to. The system resolver unless a test supplies one. */
  readonly resolve?: (host: string) => Promise<readonly string[]>;
}): RemoteTransport {
  const byOrigin = new Map(options.remotes.map((remote) => [remote.origin, remote]));
  const resolve =
    options.resolve ??
    (async (host: string) => (await lookup(host, { all: true })).map((entry) => entry.address));
  const manifests = new Map<
    string,
    { readonly version: string; readonly assets: AssemblyAssets }
  >();

  const failure = (reason: FailureReason, detail: string): AssemblyResponse => {
    const correlationId = newCorrelationId();
    options.log({
      correlationId,
      message: `remote assembly: ${reason}: ${detail}`,
      stack: undefined,
    });
    return { ok: false, reason, detail, correlationId };
  };

  const readManifest = async (
    manifest: string,
    origin: string,
    version: string,
    signal: AbortSignal,
  ) => {
    try {
      const response = await fetch(manifest, {
        redirect: "error",
        signal,
        headers: { accept: "application/json" },
      });
      if (!response.ok) throw new Error(`the manifest answered ${response.status}`);
      const body = (await response.json()) as { assets?: { css?: unknown; js?: unknown } };
      const absolute = (list: unknown): string[] =>
        Array.isArray(list)
          ? list
              .filter((item): item is string => typeof item === "string")
              .map((item) => new URL(item, origin).href)
          : [];
      return {
        version,
        assets: { css: absolute(body.assets?.css), js: absolute(body.assets?.js) },
      };
    } catch (error) {
      options.log({
        correlationId: newCorrelationId(),
        message: `remote manifest ${manifest} could not be read, and will be asked for again: ${error instanceof Error ? error.message : String(error)}`,
        stack: undefined,
      });
      return undefined;
    }
  };

  return {
    assets: (url) => manifests.get(url)?.assets,
    fetch: async (url, request) => {
      const target = parseContentUrl(url);
      const remote = target === undefined ? undefined : byOrigin.get(target.origin);
      if (target === undefined || remote === undefined) {
        return failure("invalid", `${url} is not the content endpoint of a declared remote`);
      }
      const host = new URL(target.origin).hostname.replace(/^\[|\]$/g, "");
      if (isIP(host) === 0) {
        try {
          const addresses = await resolve(host);
          if (addresses.some(isPrivateAddress)) {
            return failure("transport", `${host} resolves inside this server's network`);
          }
        } catch (error) {
          return failure(
            "transport",
            `${host} did not resolve: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      const headers: Record<string, string> = {
        accept: "text/html",
        [COMPOSITION_HEADER.page]: request.page,
        [COMPOSITION_HEADER.id]: request.id,
        [COMPOSITION_HEADER.depth]: String(request.depth),
      };
      if (request.path.length > 0) headers[COMPOSITION_HEADER.path] = request.path.join(",");
      for (const key of remote.forward ?? []) {
        const value = Object.entries(request.headers).find(
          ([name]) => name.toLowerCase() === key,
        )?.[1];
        if (value !== undefined) headers[key] = value;
      }

      let response: Response;
      try {
        response = await fetch(target.content, {
          redirect: "error",
          signal: request.signal,
          headers,
        });
      } catch (error) {
        return failure("transport", error instanceof Error ? error.message : String(error));
      }
      if (response.status < 200 || response.status > 299) {
        await response.body?.cancel();
        return failure("status", `${url} answered ${response.status}`);
      }
      if (!(response.headers.get("content-type") ?? "").toLowerCase().startsWith("text/html")) {
        await response.body?.cancel();
        return failure(
          "content-type",
          `${url} answered ${response.headers.get("content-type") ?? "no content type"}`,
        );
      }
      const body = await readCapped(response, options.maxBytes);
      if (body === undefined)
        return failure("too-large", `${url} answered more than ${options.maxBytes} bytes`);
      const html = markRemote(body, target.origin);
      if (html === undefined) return failure("invalid", `${url} did not answer one envelope`);

      const version = response.headers.get("assembly-version") ?? undefined;
      if (version !== undefined && manifests.get(url)?.version !== version) {
        const read = await readManifest(target.manifest, target.origin, version, request.signal);
        if (read !== undefined) manifests.set(url, read);
      }
      return version === undefined
        ? { ok: true, html, source: "remote" }
        : { ok: true, html, source: "remote", version };
    },
  };
}
