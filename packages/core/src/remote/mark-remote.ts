// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { escapeAttribute } from "../encode/escape-attribute.js";
import { ASSEMBLY_ROUTE_PREFIX } from "../vocab/assembly-route-prefix.js";
import { ENVELOPE_ELEMENT } from "../vocab/envelope-element.js";
import type { ContentUrl } from "./content-url.js";
import { parseContentUrl } from "./parse-content-url.js";
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
 *
 * `nested` names the assemblies the remote composed inside its answer, each once, by the content
 * endpoint it answers at on that origin: the page links their browser files as it links the
 * answer's own. An envelope marked failed is a fallback and needs none; one whose name or view
 * is not a segment names no endpoint the contract describes, and is left out.
 */
export function markRemote(
  html: string,
  origin: string,
):
  { readonly html: string; readonly nested: readonly ContentUrl[] } | { readonly refused: string } {
  const tags = scanFragment(html);
  if (typeof tags === "string") return { refused: tags };
  const stamp = ` data-remote="${escapeAttribute(origin)}"`;
  const nested = new Map<string, ContentUrl>();
  let envelopes = 0;
  let marked = "";
  let from = 0;
  for (const tag of tags) {
    let attributes: readonly ScannedAttribute[];
    let extra = "";
    if (tag.name === ENVELOPE_ELEMENT) {
      attributes = tag.attributes.filter((attribute) => attribute.name !== "data-remote");
      extra = stamp;
      // The first envelope is the answer itself; every one after it is a child inside it.
      envelopes += 1;
      const child = envelopes > 1 ? contentOf(tag.attributes, origin) : undefined;
      if (child !== undefined) nested.set(child.content, child);
    } else if (tag.name === "link") {
      attributes = tag.attributes.map((attribute) => fromOrigin(attribute, origin));
    } else {
      continue;
    }
    const kept = attributes.map((attribute) => ` ${attribute.source}`).join("");
    marked += `${html.slice(from, tag.start)}<${tag.name}${extra}${kept}>`;
    from = tag.end;
  }
  return { html: marked + html.slice(from), nested: [...nested.values()] };
}

/** The content endpoint an answered envelope names on the remote's origin, when it names one. */
function contentOf(
  attributes: readonly ScannedAttribute[],
  origin: string,
): ContentUrl | undefined {
  if (attributes.some((attribute) => attribute.name === "data-failed")) return undefined;
  const value = (name: string): string =>
    /^[^=]*=\s*(["']?)([\s\S]*)\1$/.exec(
      attributes.find((attribute) => attribute.name === name)?.source ?? "",
    )?.[2] ?? "";
  // Anything but two segments is not a path the contract has, and parses as none.
  return parseContentUrl(
    `${origin}${ASSEMBLY_ROUTE_PREFIX}/${value("data-name")}/${value("data-view")}/`,
  );
}

/** An `href` that is a path from the root, made absolute against the origin; others as sent. */
function fromOrigin(attribute: ScannedAttribute, origin: string): ScannedAttribute {
  if (attribute.name !== "href") return attribute;
  const value = /^href\s*=\s*(["']?)(.*)\1$/is.exec(attribute.source);
  // The browser strips leading and trailing control characters and spaces from a url before
  // resolving it.
  const raw = value?.[2] ?? "";
  let from = 0;
  let to = raw.length;
  while (from < to && raw.charCodeAt(from) <= 0x20) from += 1;
  while (to > from && raw.charCodeAt(to - 1) <= 0x20) to -= 1;
  const path = raw.slice(from, to);
  if (!path.startsWith("/") || path.startsWith("//")) return attribute;
  return {
    name: "href",
    source: `href="${escapeAttribute(origin)}${path.replaceAll('"', "&quot;")}"`,
  };
}
