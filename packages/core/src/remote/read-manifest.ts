// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyAssets } from "../assembly/assembly-assets.js";
import { mediaType } from "./media-type.js";
import { readCapped } from "./read-capped.js";

/**
 * A remote assembly's browser files, from its manifest, or why they could not be read.
 *
 * The manifest is read like the content: no redirect, JSON only, under the cap. Every file it
 * names is made absolute against the remote's origin, and one that leads anywhere else is left
 * out, because the page links these files as its own: a manifest is not a way to put another
 * party's script on the page. Bounded by its own deadline, never the placement's.
 */
export async function readManifest(options: {
  readonly url: string;
  readonly origin: string;
  readonly maxBytes: number;
  readonly deadline: number;
}): Promise<AssemblyAssets | string> {
  let response: Response;
  try {
    response = await fetch(options.url, {
      redirect: "error",
      signal: AbortSignal.timeout(options.deadline),
      headers: { accept: "application/json" },
    });
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  if (!response.ok) {
    await response.body?.cancel();
    return `the manifest answered ${response.status}`;
  }
  if (mediaType(response.headers.get("content-type")) !== "application/json") {
    await response.body?.cancel();
    return `the manifest answered ${response.headers.get("content-type") ?? "no content type"}`;
  }
  let text: string | undefined;
  try {
    text = await readCapped(response, options.maxBytes);
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  if (text === undefined) return `the manifest is larger than ${options.maxBytes} bytes`;
  let body: { assets?: { css?: unknown; js?: unknown } };
  try {
    body = JSON.parse(text) as typeof body;
  } catch {
    return "the manifest is not JSON";
  }
  const own = (list: unknown): string[] =>
    (Array.isArray(list) ? list : [])
      .filter((item): item is string => typeof item === "string")
      .flatMap((item) => {
        try {
          const url = new URL(item, options.origin);
          return url.origin === options.origin ? [url.href] : [];
        } catch {
          return [];
        }
      });
  return { css: own(body?.assets?.css), js: own(body?.assets?.js) };
}
