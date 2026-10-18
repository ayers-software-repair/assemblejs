// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { formatSize } from "./format-size.js";
import type { PageWeight } from "./page-weight.js";

/**
 * One page's weight as one line: its route, and the address it was weighed at where the route
 * has a parameter, then each part as sent and gzipped, and the total.
 */
export function formatWeight(weight: PageWeight): string {
  const part = (name: string, of: PageWeight["document"]) =>
    `${name} ${formatSize(of.bytes)} (${formatSize(of.gzip)} gzip)`;
  return [
    weight.address === undefined ? weight.route : `${weight.route} (${weight.address})`,
    part("document", weight.document),
    part("styles", weight.styles),
    part("scripts", weight.scripts),
    part(
      `on mount ${weight.assemblies} ${weight.assemblies === 1 ? "assembly" : "assemblies"}`,
      weight.mount,
    ),
    part("total", weight.total),
  ].join("  ");
}
