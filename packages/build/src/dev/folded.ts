// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Runs `step` one run at a time, however often it is asked for. A request made while a run is
 * under way is not a run of its own: every such request is answered by one run after the
 * current one, so ten saves during a build are one build more, begun from the sources as they
 * then stand. The running step is handed `stale`, which says whether it has been asked for
 * again since it began: what it made is then of sources that have moved on.
 *
 * `again` asks for a run, and is answered when the run that covers the request, and every run
 * folded behind it, has ended; a step that throws ends the runs, and every caller waiting is
 * told. `settled` asks for nothing: it is answered once no run is under way, whatever the last
 * one came to.
 */
export function folded(step: (stale: () => boolean) => Promise<void>): {
  again(): Promise<void>;
  settled(): Promise<void>;
} {
  let running: Promise<void> | undefined;
  let asked = false;
  return {
    again: () => {
      if (running !== undefined) {
        asked = true;
        return running;
      }
      running = (async () => {
        try {
          do {
            asked = false;
            await step(() => asked);
          } while (asked);
        } finally {
          running = undefined;
        }
      })();
      return running;
    },
    settled: async () => {
      await running?.catch(() => undefined);
    },
  };
}
