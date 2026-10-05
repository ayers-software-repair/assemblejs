// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { formatSize } from "./format-size.js";
import type { PageWeight } from "./page-weight.js";

/** One page's weight as one line: each part as sent, then gzipped. */
export function formatWeight(weight: PageWeight): string {
  const part = (name: string, of: PageWeight["document"]) =>
    `${name} ${formatSize(of.bytes)} (${formatSize(of.gzip)} gzip)`;
  return [
    weight.route,
    part("document", weight.document),
    part("styles", weight.styles),
    part("scripts", weight.scripts),
  ].join("  ");
}
