// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { findEnvelopes } from "../client/find-envelopes.js";
import { ENVELOPE_ELEMENT } from "../vocab/envelope-element.js";
import { MOUNTED_ATTRIBUTE } from "../vocab/mounted-attribute.js";
import type { EnvelopeStamps } from "./envelope-stamps.js";

/**
 * Watches a page for the two things the browser does to an envelope, and notes when: the
 * runtime marking one mounted, and a deferred placement's answer taking its placeholder's
 * place. It reads the marks the runtime already writes and asks nothing of it.
 */
export function stampEnvelopes(page: Document, now: () => number): EnvelopeStamps {
  const arrived = new WeakMap<Element, number>();
  const mounted = new WeakMap<Element, number>();
  const watched = new WeakSet<Node>();
  const observer = new MutationObserver((records) => {
    const at = now();
    for (const record of records) {
      if (record.type === "attributes" && record.target instanceof Element) {
        if (record.target.hasAttribute(MOUNTED_ATTRIBUTE)) mounted.set(record.target, at);
        else mounted.delete(record.target);
      }
      for (const added of record.addedNodes) {
        if (!(added instanceof Element)) continue;
        const envelopes = added.localName === ENVELOPE_ELEMENT ? [added] : [];
        for (const envelope of [...envelopes, ...findEnvelopes(added)]) {
          if (!arrived.has(envelope)) arrived.set(envelope, at);
        }
      }
    }
  });
  const watch = (root: Node): void => {
    if (watched.has(root)) return;
    watched.add(root);
    observer.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [MOUNTED_ATTRIBUTE],
    });
  };
  watch(page);
  return {
    arrived: (envelope) => arrived.get(envelope),
    mounted: (envelope) => mounted.get(envelope),
    watch,
    stop: () => observer.disconnect(),
  };
}
