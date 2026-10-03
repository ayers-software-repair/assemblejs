// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { watch } from "node:fs";

/**
 * Calls back once per burst of changes under a directory: an editor that writes a file in three
 * steps, or a branch switch that touches fifty, is one rebuild, not fifty. Given `only`, it
 * watches that one file directly in the directory and nothing beneath it, so a project's config
 * is watched without the build's own output setting it off. Answers the function that stops
 * watching.
 */
export function watchSources(
  directory: string,
  onChange: () => void,
  quietMs = 100,
  only?: string,
): () => void {
  let timer: NodeJS.Timeout | undefined;
  const watcher = watch(directory, { recursive: only === undefined }, (_event, file) => {
    if (only !== undefined && file !== only) return;
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(onChange, quietMs);
  });
  return () => {
    if (timer !== undefined) clearTimeout(timer);
    watcher.close();
  };
}
