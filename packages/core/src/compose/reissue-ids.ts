// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { ENVELOPE_ATTRIBUTE } from "../vocab/envelope-attribute.js";
import { ENVELOPE_ELEMENT } from "../vocab/envelope-element.js";

// The id an envelope's start tag carries, and the one shape of id a composer mints.
const ENVELOPE_ID = new RegExp(
  `<${ENVELOPE_ELEMENT}(?:\\s[^>]*?)?\\s${ENVELOPE_ATTRIBUTE.id}="([^"]*)"`,
  "gi",
);
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;
const MINTED = new RegExp(`^${UUID.source}$`);

/**
 * A kept answer, made this placement's own: every envelope in it given an id no other has.
 *
 * An answer is kept as it was first composed, with the ids that composition minted for it and
 * for each assembly inside it. Answered again as kept, two placements of it on one page carry
 * one id, and the browser, which mounts an id once, leaves the second as markup. So the first
 * envelope takes the id this placement was given and each one inside it a new one, wherever
 * the old id is written: on the envelope, on its island, in the island's own account of itself
 * and anywhere its view wrote it.
 *
 * Only an id shaped as a composer mints them is given again, since only one that long and that
 * random can be told from the text around it; another server's id of another shape stays.
 */
export function reissueIds(html: string, id: string, newId: () => string): string {
  const issued = new Map<string, string>();
  // The first envelope is the answer itself, and takes the id this placement was given.
  let outermost = true;
  for (const [, kept = ""] of html.matchAll(ENVELOPE_ID)) {
    const own = outermost;
    outermost = false;
    if (issued.has(kept) || !MINTED.test(kept)) continue;
    issued.set(kept, own ? id : newId());
  }
  if (issued.size === 0) return html;
  return html.replace(UUID, (written) => issued.get(written) ?? written);
}
