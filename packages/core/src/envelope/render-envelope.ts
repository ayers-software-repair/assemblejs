// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
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
  if (input.failed === true) attributes.push(["data-failed", ""]);

  const opening = attributes.map(([key, value]) => ` ${key}="${escapeAttribute(value)}"`).join("");

  const island = encodeIslandJson({ ...projectIsland(input) });
  const script =
    `<script type="${ISLAND_SCRIPT_TYPE}" data-assembly="${escapeAttribute(input.id)}">` +
    `${island}</script>`;

  return `<${ENVELOPE_ELEMENT}${opening}>${input.markup}${script}</${ENVELOPE_ELEMENT}>`;
}
