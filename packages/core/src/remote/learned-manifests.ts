// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyAssets } from "../assembly/assembly-assets.js";
import type { LogLine } from "../failure/log-line.js";
import { newCorrelationId } from "../failure/new-correlation-id.js";
import { readManifest } from "./read-manifest.js";

const MANIFEST_DEADLINE = 1000;

/**
 * What other servers' manifests declared, kept by the url of the assembly each belongs to.
 *
 * A manifest is read once per version of its server's output: the content says which version
 * answered, and a version already read is not asked for again. Concurrent first requests ask
 * once between them. A manifest that cannot be read is a logged warning and a retry the next
 * time its version is seen, never a failed placement, and it is bounded by its own deadline.
 */
export function learnedManifests(options: {
  readonly maxBytes: number;
  readonly log: (line: LogLine) => void;
}): {
  /** Reads the manifest for the assembly at a url, unless this version of it was already read. */
  learn(url: string, manifest: string, origin: string, version: string): void;
  /** The files learned for a url; a read still in flight is waited for, within its deadline. */
  assets(url: string): Promise<AssemblyAssets | undefined>;
} {
  const manifests = new Map<
    string,
    { readonly version: string; readonly assets: AssemblyAssets }
  >();
  // The read in flight for a url, so concurrent first requests ask once between them.
  const reading = new Map<string, Promise<void>>();
  return {
    learn: (url, manifest, origin, version) => {
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
    },
    assets: async (url) => {
      await reading.get(url);
      return manifests.get(url)?.assets;
    },
  };
}
