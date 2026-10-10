// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { ASSEMBLY_ROUTE_PREFIX } from "../vocab/assembly-route-prefix.js";
import { COMPOSITION_HEADER } from "../vocab/composition-header.js";
import { ENVELOPE_ELEMENT } from "../vocab/envelope-element.js";

// The fallback a page declared for a deferred placement, carried inert inside its placeholder.
const FALLBACK = ":scope > template[data-fallback]";

/**
 * Fetches a deferred placement's content from its own server's content endpoint, with the id and
 * the page's route parameters its placeholder carries, the page's own query, and the depth a
 * page's placement has, as a placement rendered with the page is asked, and answers the envelope
 * now in the placeholder's place, to be considered for mounting.
 *
 * The answer is parsed as the page itself was, a declarative shadow root attached, where the
 * browser can. On a failure the placement shows what DESIGN 3.3 says a failed one shows: the
 * fallback its page declared, in the server's failed envelope marked with the id its failure is
 * logged against, or marked failed with no id when no answer came at all.
 */
export async function fillDeferred(
  element: Element,
  signal: AbortSignal,
): Promise<Element | undefined> {
  const name = element.getAttribute("data-name");
  const view = element.getAttribute("data-view") ?? "default";
  const id = element.getAttribute("data-id");
  if (name === null || id === null) return undefined;
  const search = element.ownerDocument.defaultView?.location.search ?? "";
  const url = `${ASSEMBLY_ROUTE_PREFIX}/${encodeURIComponent(name)}/${encodeURIComponent(view)}/${search}`;
  const params = element.getAttribute("data-params");
  // One level deep, as the page's own composer would have asked: the children its view places
  // are then composed from the depth they would have had if it had been rendered with the page.
  const headers: Record<string, string> = {
    [COMPOSITION_HEADER.id]: id,
    [COMPOSITION_HEADER.depth]: "1",
  };
  if (params !== null && params !== "") headers[COMPOSITION_HEADER.params] = params;
  let answer: Element | undefined;
  try {
    const response = await fetch(url, { headers, signal });
    const type = response.headers.get("content-type") ?? "";
    if (type.startsWith("text/html")) answer = envelopeOf(element, await response.text(), id);
    // Anything but a 2xx is a failure, whatever envelope it carries.
    if (answer !== undefined && !response.ok && !answer.hasAttribute("data-failed")) {
      answer = undefined;
    }
  } catch (error) {
    if (signal.aborted) throw error;
    answer = undefined;
  }
  if (answer !== undefined && !answer.hasAttribute("data-failed")) {
    element.replaceWith(answer);
    return answer;
  }
  return standIn(element, answer);
}

/** The one envelope stamped with this id that `html` holds, parsed as the page was. */
function envelopeOf(element: Element, html: string, id: string): Element | undefined {
  const container = element.ownerDocument.createElement("div");
  if ("setHTMLUnsafe" in container && typeof container.setHTMLUnsafe === "function") {
    container.setHTMLUnsafe(html);
  } else {
    container.innerHTML = html;
  }
  const found = container.firstElementChild;
  return found !== null &&
    container.childElementCount === 1 &&
    found.tagName.toLowerCase() === ENVELOPE_ELEMENT &&
    found.getAttribute("data-id") === id
    ? found
    : undefined;
}

/** The placement as failed: the server's failed envelope, or the placeholder marked failed. */
function standIn(element: Element, failed: Element | undefined): Element {
  const fallback = element.querySelector(FALLBACK);
  const shown = failed ?? element;
  if (failed === undefined) {
    element.removeAttribute("data-defer");
    element.setAttribute("data-failed", "");
    for (const child of [...element.children]) child.remove();
  } else {
    element.replaceWith(failed);
  }
  if (fallback instanceof HTMLTemplateElement) shown.prepend(fallback.content.cloneNode(true));
  return shown;
}
