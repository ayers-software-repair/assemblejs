// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { escapeAttribute } from "../encode/escape-attribute.js";
import { ENVELOPE_ELEMENT } from "../vocab/envelope-element.js";
import { scanFragment } from "./scan-fragment.js";
import type { ScannedAttribute } from "./scanned-attribute.js";

/**
 * A remote's answer with the origin it came from stamped on every envelope in it, or why the
 * answer was refused. The browser runtime that owns that origin mounts those envelopes, and no
 * other runtime touches them. Every envelope is stamped, not only the outer one, and any origin
 * the answer already named is replaced: a remote names no origin but its own, so an envelope it
 * sends can never be mounted by the page's runtime, wherever it ends up in the document.
 *
 * A stylesheet the answer links by a path from its own root, as an assembly in its own shadow
 * root does, is linked from the remote's origin, because on the page that path names the page's.
 */
export function markRemote(
  html: string,
  origin: string,
): { readonly html: string } | { readonly refused: string } {
  const tags = scanFragment(html);
  if (typeof tags === "string") return { refused: tags };
  const stamp = ` data-remote="${escapeAttribute(origin)}"`;
  let marked = "";
  let from = 0;
  for (const tag of tags) {
    let attributes: readonly ScannedAttribute[];
    let extra = "";
    if (tag.name === ENVELOPE_ELEMENT) {
      attributes = tag.attributes.filter((attribute) => attribute.name !== "data-remote");
      extra = stamp;
    } else if (tag.name === "link") {
      attributes = tag.attributes.map((attribute) => fromOrigin(attribute, origin));
    } else {
      continue;
    }
    const kept = attributes.map((attribute) => ` ${attribute.source}`).join("");
    marked += `${html.slice(from, tag.start)}<${tag.name}${extra}${kept}>`;
    from = tag.end;
  }
  return { html: marked + html.slice(from) };
}

/** An `href` that is a path from the root, made absolute against the origin; others as sent. */
function fromOrigin(attribute: ScannedAttribute, origin: string): ScannedAttribute {
  if (attribute.name !== "href") return attribute;
  const value = /^href\s*=\s*(["']?)(.*)\1$/is.exec(attribute.source);
  const path = value?.[2] ?? "";
  if (!path.startsWith("/") || path.startsWith("//")) return attribute;
  return {
    name: "href",
    source: `href="${escapeAttribute(origin)}${path.replaceAll('"', "&quot;")}"`,
  };
}
