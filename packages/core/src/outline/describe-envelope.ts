// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readMountMode } from "../client/read-mount-mode.js";
import { DEFAULT_VIEW } from "../vocab/default-view.js";
import { ENVELOPE_ATTRIBUTE } from "../vocab/envelope-attribute.js";
import { ENVELOPE_ELEMENT } from "../vocab/envelope-element.js";
import { MOUNTED_ATTRIBUTE } from "../vocab/mounted-attribute.js";
import type { EnvelopeFacts } from "./envelope-facts.js";
import { formatMs } from "./format-ms.js";
import type { OutlinePlacement } from "./outline-placement.js";

const WAITS = {
  load: "waiting to mount, as soon as its module arrives",
  idle: "waiting to mount, when the browser is idle",
  visible: "waiting to mount, when it scrolls into view",
} as const;

/**
 * What an outline says of one envelope: read from the envelope itself, from the server's
 * account of its placement where there is one, and from when the browser was seen to put it on
 * the page and bring it alive. Where and when, in words a person reads.
 *
 * An envelope with no account of its own is told by what holds it, which is all the page knows:
 * it came with an answer the server kept, fetched from another server or was asked for later.
 */
export function describeEnvelope(
  envelope: Element,
  placement: OutlinePlacement | undefined,
  stamps: { readonly arrived?: number | undefined; readonly mounted?: number | undefined } = {},
): EnvelopeFacts {
  const read = (name: string): string | undefined => envelope.getAttribute(name) ?? undefined;
  const view = read(ENVELOPE_ATTRIBUTE.view) ?? DEFAULT_VIEW;
  const name = `${read(ENVELOPE_ATTRIBUTE.name) ?? ""}${view === DEFAULT_VIEW ? "" : `:${view}`}`;
  const around = holder(envelope);
  const origin =
    read(ENVELOPE_ATTRIBUTE.remote) ??
    envelope.closest(`[${ENVELOPE_ATTRIBUTE.remote}]`)?.getAttribute(ENVELOPE_ATTRIBUTE.remote) ??
    undefined;
  const failed = read(ENVELOPE_ATTRIBUTE.failed);
  const within = around?.getAttribute(ENVELOPE_ATTRIBUTE.name) ?? undefined;

  let tone: EnvelopeFacts["tone"] = "inner";
  let brief = within === undefined ? "no account" : `in ${within}`;
  let answered =
    within === undefined
      ? "the server gave no account of it"
      : `arrived inside the answer for ${within}`;
  if (failed !== undefined) {
    tone = "fallback";
    brief = "fallback";
    answered = failed === "" ? "a fallback" : `a fallback; the failure is logged as ${failed}`;
    if (placement?.refused !== undefined) {
      answered += `, one of ${placement.refused} the request refused past its limit`;
    }
  } else if (envelope.hasAttribute(ENVELOPE_ATTRIBUTE.defer)) {
    tone = "deferred";
    brief = "deferred";
    answered = "deferred: the browser asks for it once the page has loaded";
  } else if (placement?.source === "deferred") {
    tone = "deferred";
    brief = stamps.arrived === undefined ? "deferred" : `deferred, ${formatMs(stamps.arrived)}`;
    answered =
      stamps.arrived === undefined
        ? "asked for by the browser, after the page loaded"
        : `asked for by the browser, and here ${formatMs(stamps.arrived)} after the page began`;
  } else if (placement?.source === "cache") {
    tone = "cache";
    brief = "kept";
    answered = `an answer the server kept, read in ${formatMs(placement.ms)}`;
  } else if (placement?.source === "remote" || (placement === undefined && origin !== undefined)) {
    tone = "remote";
    if (placement !== undefined) {
      brief = formatMs(placement.ms);
      answered = `fetched by the server in ${formatMs(placement.ms)}`;
    }
  } else if (placement?.source === "local") {
    tone = "local";
    brief = formatMs(placement.ms);
    answered = `rendered by the server in ${formatMs(placement.ms)}`;
  }

  const rows: (readonly [string, string])[] = [
    ["From", origin ?? "this server"],
    ["Answered", answered],
  ];
  const renderer = read(ENVELOPE_ATTRIBUTE.renderer) ?? "";
  if (renderer !== "") rows.push(["Renderer", renderer]);
  const browser = inBrowser(envelope, placement, failed !== undefined, stamps.mounted);
  if (browser !== undefined) rows.push(["In the browser", browser]);
  if (envelope.hasAttribute(MOUNTED_ATTRIBUTE)) brief += ", live";
  return { name, tone, brief, rows };
}

/** The envelope an envelope stands inside, across the shadow root it may be in. */
function holder(envelope: Element): Element | undefined {
  const inside = envelope.parentElement?.closest(ENVELOPE_ELEMENT);
  if (inside !== null && inside !== undefined) return inside;
  const root = envelope.getRootNode();
  const host = "host" in root && root.host instanceof Element ? root.host : undefined;
  return host?.closest(ENVELOPE_ELEMENT) ?? undefined;
}

/** What the browser has done with an envelope, or undefined where there is nothing to say. */
function inBrowser(
  envelope: Element,
  placement: OutlinePlacement | undefined,
  failed: boolean,
  mounted: number | undefined,
): string | undefined {
  // A fallback is the page's markup, not the assembly's, and is never mounted.
  if (failed) return undefined;
  if (envelope.hasAttribute(MOUNTED_ATTRIBUTE)) {
    return mounted === undefined
      ? "mounted and live"
      : `mounted and live ${formatMs(mounted)} after the page began`;
  }
  const mode = readMountMode(envelope);
  if (mode === "none") return "static: declared never to mount";
  if (placement?.browser === false) return "static HTML: it sends no JavaScript";
  // Whether one that is not this server's to speak for will mount, the page cannot say.
  if (placement?.browser !== true || envelope.hasAttribute(ENVELOPE_ATTRIBUTE.defer)) {
    return undefined;
  }
  return WAITS[mode];
}
