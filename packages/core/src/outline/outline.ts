// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { findEnvelopes } from "../client/find-envelopes.js";
import { ENVELOPE_ATTRIBUTE } from "../vocab/envelope-attribute.js";
import { OUTLINE_ELEMENT } from "../vocab/outline-element.js";
import { OUTLINE_ROUTE } from "../vocab/outline-route.js";
import { accountIndex } from "./account-index.js";
import { createBox } from "./create-box.js";
import { createToolbar } from "./create-toolbar.js";
import { describeEnvelope } from "./describe-envelope.js";
import { envelopeRect } from "./envelope-rect.js";
import { formatMs } from "./format-ms.js";
import type { OutlineBox } from "./outline-box.js";
import { outlineShown } from "./outline-shown.js";
import { placeChips } from "./place-chips.js";
import { readAccount } from "./read-account.js";
import { stampEnvelopes } from "./stamp-envelopes.js";

// How often the page is read again for envelopes that came or went, in milliseconds. Where
// each box stands is measured every frame, since a page moves without telling anyone.
const RESCAN = 250;

/**
 * Draws a page's outline: a switch at the corner of the window and, while a visitor has it on,
 * a box around every assembly on the page that says what it is, where it came from and when,
 * on the server and in the browser. Answers the function that takes it all away again.
 *
 * It is drawn over the page, in one element after the body with a root of its own, and nothing
 * on the page is touched: no envelope gains an attribute, a style or a child, so a page with
 * its outline on is laid out as the page without it. It runs no framework, reads the marks the
 * server and the runtime already write, and draws nothing until its stylesheet has arrived.
 */
export function outline(
  page: Document = document,
  stylesheet: string = OUTLINE_ROUTE.stylesheet,
): () => void {
  const view = page.defaultView;
  if (view === null || page.querySelector(OUTLINE_ELEMENT) !== null) return () => undefined;
  const account = readAccount(page);
  const placements = accountIndex(account);
  const stamps = stampEnvelopes(page, () => view.performance.now());

  const host = page.createElement(OUTLINE_ELEMENT);
  host.hidden = true;
  const root = host.attachShadow({ mode: "open" });
  const sheet = page.createElement("link");
  sheet.rel = "stylesheet";
  sheet.href = stylesheet;
  sheet.addEventListener("load", () => {
    host.hidden = false;
  });
  sheet.addEventListener("error", () => {
    console.warn(`assemblejs: ${stylesheet} did not load, so the page's outline is not drawn`);
  });
  // Every frame beneath every note, so no frame is drawn across a chip.
  const layer = page.createElement("div");
  layer.className = "layer";
  const frames = page.createElement("div");
  const notes = page.createElement("div");
  layer.append(frames, notes);

  const boxes = new Map<Element, OutlineBox>();
  let envelopes: Element[] = [];
  let shown = outlineShown(page);
  let scanned = -Infinity;
  let frame = 0;

  const summary = (): string => {
    const count = `${envelopes.length} ${envelopes.length === 1 ? "assembly" : "assemblies"}`;
    return account === undefined
      ? count
      : `${account.route}: ${count}, composed in ${formatMs(account.ms)}`;
  };

  const scan = (): void => {
    envelopes = findEnvelopes(page);
    const present = new Set(envelopes);
    for (const [envelope, box] of boxes) {
      if (present.has(envelope)) continue;
      box.frame.remove();
      box.note.remove();
      boxes.delete(envelope);
    }
    for (const envelope of envelopes) {
      // What happens inside a shadow root is told only to whoever watches that root.
      stamps.watch(envelope.getRootNode());
      let box = boxes.get(envelope);
      if (box === undefined) {
        box = createBox(page);
        boxes.set(envelope, box);
        frames.append(box.frame);
        notes.append(box.note);
      }
      box.tell(
        describeEnvelope(
          envelope,
          placements.get(envelope.getAttribute(ENVELOPE_ATTRIBUTE.id) ?? ""),
          { arrived: stamps.arrived(envelope), mounted: stamps.mounted(envelope) },
        ),
      );
    }
    toolbar.show(shown, summary());
  };

  const draw = (now: number): void => {
    if (now - scanned >= RESCAN) {
      scanned = now;
      scan();
    }
    // Every measure first, then every move, so a frame lays the page out once.
    const drawn = envelopes.map((envelope) => ({
      box: boxes.get(envelope),
      rect: envelopeRect(envelope),
    }));
    const wide = page.documentElement.clientWidth;
    const chips = placeChips(
      drawn.map(({ box, rect }) => {
        if (box === undefined || rect === undefined) return undefined;
        const chip = box.room();
        // A chip stands on its box's top edge, clear of what the assembly shows, and stays in
        // the window while any of the box does, so a long assembly keeps its name.
        const top = Math.min(
          Math.max(0, rect.top - chip.height),
          rect.top + rect.height - chip.height,
        );
        return { left: Math.max(0, Math.min(rect.left, wide - chip.width)), top, ...chip };
      }),
    );
    drawn.forEach(({ box, rect }, at) => box?.move(rect, chips[at]));
    frame = view.requestAnimationFrame(draw);
  };

  const apply = (): void => {
    view.cancelAnimationFrame(frame);
    layer.hidden = !shown;
    toolbar.show(shown, summary());
    if (shown) {
      scanned = -Infinity;
      frame = view.requestAnimationFrame(draw);
    }
  };

  const toolbar = createToolbar(page, () => {
    shown = outlineShown(page, !shown);
    apply();
  });
  root.append(sheet, layer, toolbar.element);
  page.documentElement.append(host);
  apply();

  return () => {
    view.cancelAnimationFrame(frame);
    stamps.stop();
    host.remove();
  };
}
