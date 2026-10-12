// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyAssets } from "../assembly/assembly-assets.js";
import type { LogLine } from "../failure/log-line.js";
import { newCorrelationId } from "../failure/new-correlation-id.js";
import type { ContentUrl } from "./content-url.js";
import { readManifest } from "./read-manifest.js";

const MANIFEST_DEADLINE = 1000;
// What is kept and what is asked for follow what other servers' answers name, so each has a
// bound: the manifests kept, the assemblies one url's answers are remembered to have held, and
// the reads in flight at once.
const KEPT = 4096;
const HELD = 1024;
const READS = 256;

// Lets the oldest of a map or a set go until no more than `most` are kept.
const bound = <Key>(
  kept: { readonly size: number; keys(): IterableIterator<Key>; delete(key: Key): boolean },
  most: number,
): void => {
  for (const oldest of kept.keys()) {
    if (kept.size <= most) return;
    kept.delete(oldest);
  }
};

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
 *
 * Which assemblies an answer holds is the other server's to say, and it may name new ones with
 * every answer. So nothing here grows with what it says: a bounded number of manifests is kept
 * and of children remembered for one url, the oldest let go first and read again if it is seen
 * again; and a bounded number of reads is in flight, one past the bound left for the next time
 * its assembly is seen, as one that could not be read is.
 */
export function learnedManifests(options: {
  readonly maxBytes: number;
  readonly log: (line: LogLine) => void;
  /** The manifests kept, where that is not the bound this file names. */
  readonly kept?: number;
  /** The assemblies one url's answers are remembered to have held, likewise. */
  readonly held?: number;
  /** The reads in flight at once, likewise. */
  readonly reads?: number;
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
  const kept = options.kept ?? KEPT;
  const held = options.held ?? HELD;
  const reads = options.reads ?? READS;
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
  // Said when the reads in flight reach their bound, and again only once they have been under
  // it: a line for every read left waiting would be a flood of its own.
  let full = false;
  const read = (url: string, manifest: string, origin: string, version: string): void => {
    if (manifests.get(url)?.version === version || reading.has(url)) return;
    if (reading.size >= reads) {
      if (!full) {
        options.log({
          correlationId: newCorrelationId(),
          message: `${String(reads)} remote manifests are being read at once, the most this server reads; ${manifest} and any others past that will be asked for when next seen`,
          stack: undefined,
        });
      }
      full = true;
      return;
    }
    full = false;
    const pending = readManifest({
      url: manifest,
      origin,
      maxBytes: options.maxBytes,
      deadline: MANIFEST_DEADLINE,
    }).then((assets) => {
      reading.delete(url);
      if (typeof assets !== "string") {
        // Set afresh, so a manifest read again is the newest kept.
        manifests.delete(url);
        manifests.set(url, { version, assets });
        bound(manifests, kept);
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
      const before = inside.get(url);
      const urls = before?.version === version ? before.urls : new Set<string>();
      for (const child of nested) {
        // Added afresh, so a child seen again is the newest remembered.
        urls.delete(child.content);
        urls.add(child.content);
        read(child.content, child.manifest, child.origin, version);
      }
      bound(urls, held);
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
