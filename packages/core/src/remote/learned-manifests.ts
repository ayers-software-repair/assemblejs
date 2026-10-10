// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyAssets } from "../assembly/assembly-assets.js";
import type { LogLine } from "../failure/log-line.js";
import { newCorrelationId } from "../failure/new-correlation-id.js";
import type { ContentUrl } from "./content-url.js";
import { readManifest } from "./read-manifest.js";

const MANIFEST_DEADLINE = 1000;

/**
 * What other servers' manifests declared, kept by the url of the assembly each belongs to.
 *
 * A manifest is read once per version of its server's output: the content says which version
 * answered, and a version already read is not asked for again. Concurrent first requests ask
 * once between them. A manifest that cannot be read is a logged warning and a retry the next
 * time its version is seen, never a failed placement, and it is bounded by its own deadline.
 *
 * An answer may hold other assemblies its server composed inside it. Each has a manifest of its
 * own, read by the same rule, and the files a url's page links are its own and theirs.
 */
export function learnedManifests(options: {
  readonly maxBytes: number;
  readonly log: (line: LogLine) => void;
}): {
  /**
   * Reads the manifest for the assembly at a url, and for each assembly its answer held inside
   * it, unless this version of each was already read.
   */
  learn(
    url: string,
    manifest: string,
    origin: string,
    version: string,
    nested: readonly ContentUrl[],
  ): void;
  /**
   * The files learned for a url and for everything its answers have held inside them; a read
   * still in flight is waited for, within its deadline.
   */
  assets(url: string): Promise<AssemblyAssets | undefined>;
} {
  const manifests = new Map<
    string,
    { readonly version: string; readonly assets: AssemblyAssets }
  >();
  // The read in flight for a url, so concurrent first requests ask once between them.
  const reading = new Map<string, Promise<void>>();
  // What a url's answers have held inside them, for as long as its version stands: every child
  // seen is kept, so an answer served again from the page's cache links what it holds, and a
  // child one request's answer left out is still linked for the request whose answer has it.
  const inside = new Map<string, { readonly version: string; readonly urls: Set<string> }>();
  const read = (url: string, manifest: string, origin: string, version: string): void => {
    if (manifests.get(url)?.version === version || reading.has(url)) return;
    const pending = readManifest({
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
    reading.set(url, pending);
  };
  const learned = async (url: string): Promise<AssemblyAssets | undefined> => {
    await reading.get(url);
    return manifests.get(url)?.assets;
  };
  return {
    learn: (url, manifest, origin, version, nested) => {
      read(url, manifest, origin, version);
      const held = inside.get(url);
      const urls = held?.version === version ? held.urls : new Set<string>();
      for (const child of nested) {
        urls.add(child.content);
        read(child.content, child.manifest, child.origin, version);
      }
      inside.set(url, { version, urls });
    },
    assets: async (url) => {
      const all = await Promise.all([url, ...(inside.get(url)?.urls ?? [])].map(learned));
      const found = all.filter((assets) => assets !== undefined);
      if (found.length === 0) return undefined;
      return {
        css: found.flatMap((assets) => assets.css),
        js: found.flatMap((assets) => assets.js),
      };
    },
  };
}
