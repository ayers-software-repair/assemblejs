// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { escapeAttribute } from "../encode/escape-attribute.js";
import { ENVELOPE_ELEMENT } from "../vocab/envelope-element.js";

const OPENING = new RegExp(`^\\s*<${ENVELOPE_ELEMENT}(?=[\\s>])`, "i");

/**
 * A remote fragment with the origin it came from stamped on its envelope, or undefined when the
 * fragment is not one envelope at all. The browser runtime that owns that origin mounts it, and
 * no other runtime touches it. An envelope that already names an origin keeps it: it was
 * composed by the remote from a server further away.
 */
export function markRemote(html: string, origin: string): string | undefined {
  const opening = OPENING.exec(html);
  if (opening === null) return undefined;
  if (!html.trimEnd().toLowerCase().endsWith(`</${ENVELOPE_ELEMENT}>`)) return undefined;
  const at = opening.index + opening[0].length;
  // A fragment that came from further away already names its own origin, which stays.
  const tag = html.slice(at, html.indexOf(">", at));
  if (/\sdata-remote=/i.test(tag)) return html;
  return `${html.slice(0, at)} data-remote="${escapeAttribute(origin)}"${html.slice(at)}`;
}
