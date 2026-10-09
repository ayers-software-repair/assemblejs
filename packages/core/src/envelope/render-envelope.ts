// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { encodeParams } from "../compose/encode-params.js";
import { encodeIslandJson } from "../encode/encode-island-json.js";
import { escapeAttribute } from "../encode/escape-attribute.js";
import { ENVELOPE_ELEMENT } from "../vocab/envelope-element.js";
import { ISLAND_SCRIPT_TYPE } from "../vocab/island-script-type.js";
import type { EnvelopeInput } from "./envelope-input.js";
import { projectIsland } from "./project-island.js";

/**
 * The one element every fragment is wrapped in, and the canonical attribute set.
 *
 * The envelope is BUILT, never concatenated from caller-supplied text: attributes come from a
 * fixed list of known keys and every value passes the attribute encoder, so no value can end
 * the tag it sits in whatever it contains.
 */
export function renderEnvelope(input: EnvelopeInput): string {
  const attributes: Array<readonly [string, string]> = [
    ["data-name", input.name],
    ["data-id", input.id],
    ["data-view", input.view],
    ["data-renderer", input.renderer],
  ];
  if (input.remote !== undefined) attributes.push(["data-remote", input.remote]);
  if (input.deferred === true) attributes.push(["data-defer", ""]);
  const params =
    input.deferred === true && input.params !== undefined ? encodeParams(input.params) : "";
  if (params !== "") attributes.push(["data-params", params]);
  if (input.failed !== undefined) attributes.push(["data-failed", input.failed]);
  if (input.mount !== undefined && input.mount !== "load") {
    attributes.push(["data-mount", input.mount]);
  }

  const opening = attributes.map(([key, value]) => ` ${key}="${escapeAttribute(value)}"`).join("");

  const island = encodeIslandJson({ ...projectIsland(input) });
  const script =
    `<script type="${ISLAND_SCRIPT_TYPE}" data-assembly="${escapeAttribute(input.id)}">` +
    `${island}</script>`;

  // A shadow root's styles are linked inside it, the only place they apply, and after the
  // markup: a framework hydrating the root starts at its first node, and one that met a link there
  // would take it for a mismatch and render afresh. The island stays in the light DOM, where the
  // runtime reads it like any other.
  const markup =
    input.shadow === undefined
      ? input.markup
      : `<template shadowrootmode="open">${input.markup}${input.shadow.css
          .map((href) => `<link rel="stylesheet" href="${escapeAttribute(href)}">`)
          .join("")}</template>`;
  return `<${ENVELOPE_ELEMENT}${opening}>${markup}${script}</${ENVELOPE_ELEMENT}>`;
}
