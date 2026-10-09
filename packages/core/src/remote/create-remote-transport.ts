// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { AssemblyAssets } from "../assembly/assembly-assets.js";
import type { AssemblyResponse } from "../compose/assembly-response.js";
import { encodeParams } from "../compose/encode-params.js";
import type { FailureReason } from "../compose/failure-reason.js";
import type { LogLine } from "../failure/log-line.js";
import { newCorrelationId } from "../failure/new-correlation-id.js";
import { COMPOSITION_HEADER } from "../vocab/composition-header.js";
import { isPrivateAddress } from "./is-private-address.js";
import { markRemote } from "./mark-remote.js";
import { mediaType } from "./media-type.js";
import { parseContentUrl } from "./parse-content-url.js";
import { readCapped } from "./read-capped.js";
import { readManifest } from "./read-manifest.js";
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
 * further than here. The manifest is read once per version of the remote's output, beside the
 * content rather than in front of it, and a manifest that cannot be read is a logged warning and
 * a retry, never a failed placement.
 */
const MANIFEST_DEADLINE = 1000;

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

  // The read in flight for a url, so concurrent first requests ask once between them.
  const reading = new Map<string, Promise<void>>();
  const learn = (url: string, manifest: string, origin: string, version: string): void => {
    if (manifests.get(url)?.version === version || reading.has(url)) return;
    const read = readManifest({
      url: manifest,
      origin,
      maxBytes: options.maxBytes,
      deadline: MANIFEST_DEADLINE,
    }).then((assets) => {
      reading.delete(url);
      if (typeof assets !== "string") {
        manifests.set(url, { version, assets });
        return;
      }
      options.log({
        correlationId: newCorrelationId(),
        message: `remote manifest ${manifest} could not be read, and will be asked for again: ${assets}`,
        stack: undefined,
      });
    });
    reading.set(url, read);
  };

  return {
    assets: async (url) => {
      await reading.get(url);
      return manifests.get(url)?.assets;
    },
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

      // The declared keys first and the composition state over them, so nothing a visitor sent
      // can stand in for what the composer says; boot refuses a declaration that names one.
      const headers: Record<string, string> = {};
      for (const key of remote.forward ?? []) {
        const value = Object.entries(request.headers).find(
          ([name]) => name.toLowerCase() === key,
        )?.[1];
        if (value !== undefined) headers[key] = value;
      }
      headers.accept = "text/html";
      headers[COMPOSITION_HEADER.page] = request.page;
      headers[COMPOSITION_HEADER.id] = request.id;
      headers[COMPOSITION_HEADER.depth] = String(request.depth);
      if (request.path.length > 0) headers[COMPOSITION_HEADER.path] = request.path.join(",");
      const params = encodeParams(request.params);
      if (params !== "") headers[COMPOSITION_HEADER.params] = params;

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
      if (mediaType(response.headers.get("content-type")) !== "text/html") {
        await response.body?.cancel();
        return failure(
          "content-type",
          `${url} answered ${response.headers.get("content-type") ?? "no content type"}`,
        );
      }
      const body = await readCapped(response, options.maxBytes);
      if (body === undefined)
        return failure("too-large", `${url} answered more than ${options.maxBytes} bytes`);
      const marked = markRemote(body, target.origin);
      if ("refused" in marked) {
        return failure("invalid", `${url} did not answer one envelope: ${marked.refused}`);
      }
      const { html } = marked;

      // The content has arrived, so the placement is answered now; the manifest is learned
      // beside it and never holds it.
      const version = response.headers.get("assembly-version") ?? undefined;
      if (version !== undefined) learn(url, target.manifest, target.origin, version);
      return version === undefined
        ? { ok: true, html, source: "remote" }
        : { ok: true, html, source: "remote", version };
    },
  };
}
