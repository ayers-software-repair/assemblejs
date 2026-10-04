// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { ASSEMBLY_ROUTE_PREFIX } from "../vocab/assembly-route-prefix.js";
import { ENVELOPE_ELEMENT } from "../vocab/envelope-element.js";

/**
 * Fetches a deferred placement's content from its own server's content endpoint, with the id
 * its empty envelope carries, and puts the envelope that answers in its place, answering it to
 * be mounted. Anything but one html envelope stamped with that id leaves the placeholder as it
 * is: a failure, which the server logged, shows nothing rather than something unaccounted for.
 */
export async function fillDeferred(
  element: Element,
  signal: AbortSignal,
): Promise<Element | undefined> {
  const name = element.getAttribute("data-name");
  const view = element.getAttribute("data-view") ?? "default";
  const id = element.getAttribute("data-id");
  if (name === null || id === null) return undefined;
  const url = `${ASSEMBLY_ROUTE_PREFIX}/${encodeURIComponent(name)}/${encodeURIComponent(view)}/`;
  const response = await fetch(url, { headers: { "assembly-id": id }, signal });
  const type = response.headers.get("content-type") ?? "";
  if (!response.ok || !type.startsWith("text/html")) return undefined;
  const template = element.ownerDocument.createElement("template");
  template.innerHTML = await response.text();
  const filled = template.content.firstElementChild;
  if (
    filled === null ||
    template.content.childElementCount !== 1 ||
    filled.tagName.toLowerCase() !== ENVELOPE_ELEMENT ||
    filled.getAttribute("data-id") !== id
  ) {
    return undefined;
  }
  element.replaceWith(filled);
  return filled;
}
