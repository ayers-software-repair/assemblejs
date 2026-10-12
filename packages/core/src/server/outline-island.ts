// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { encodeIslandJson } from "../encode/encode-island-json.js";
import type { OutlineAccount } from "../outline/outline-account.js";
import { ISLAND_SCRIPT_TYPE } from "../vocab/island-script-type.js";
import { OUTLINE_ATTRIBUTE } from "../vocab/outline-attribute.js";

/**
 * The one data block a page carries for its outline: the account of how it was composed, as
 * data a browser does not run, encoded as every island is so that nothing in it can end the
 * element it is written in.
 */
export function outlineIsland(account: OutlineAccount): string {
  return `<script type="${ISLAND_SCRIPT_TYPE}" ${OUTLINE_ATTRIBUTE}>${encodeIslandJson(account)}</script>`;
}
