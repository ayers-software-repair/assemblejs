// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { watch } from "node:fs";

/**
 * Calls back once per burst of changes under a directory: an editor that writes a file in three
 * steps, or a branch switch that touches fifty, is one rebuild, not fifty. Answers the function
 * that stops watching.
 */
export function watchSources(directory: string, onChange: () => void, quietMs = 100): () => void {
  let timer: NodeJS.Timeout | undefined;
  const watcher = watch(directory, { recursive: true }, () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(onChange, quietMs);
  });
  return () => {
    if (timer !== undefined) clearTimeout(timer);
    watcher.close();
  };
}
