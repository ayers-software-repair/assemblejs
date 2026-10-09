// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { fillDeferred } from "./fill-deferred.js";

/**
 * Fills a deferred envelope once its page has loaded, now if it already has, and hands the
 * envelope that took its place to `filled`. Answers the cancel, which stops a fill not yet begun
 * and abandons one in flight.
 */
export function scheduleFill(element: Element, filled: (envelope: Element) => void): () => void {
  const controller = new AbortController();
  const fill = (): void => {
    fillDeferred(element, controller.signal).then(
      (envelope) => {
        if (envelope !== undefined && !controller.signal.aborted) filled(envelope);
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        const name = element.getAttribute("data-name") ?? "";
        console.error(`assemblejs: the deferred "${name}" was not filled`, error);
      },
    );
  };
  const view = element.ownerDocument.defaultView;
  if (element.ownerDocument.readyState === "complete" || view === null) fill();
  else view.addEventListener("load", fill, { once: true });
  return () => {
    view?.removeEventListener("load", fill);
    controller.abort();
  };
}
