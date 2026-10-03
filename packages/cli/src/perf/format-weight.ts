// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { PageWeight } from "./page-weight.js";

const size = (bytes: number): string =>
  bytes < 1000 ? `${bytes} B` : `${(bytes / 1000).toFixed(1)} kB`;

/** One page's weight as one line: each part as sent, then gzipped. */
export function formatWeight(weight: PageWeight): string {
  const part = (name: string, of: PageWeight["document"]) =>
    `${name} ${size(of.bytes)} (${size(of.gzip)} gzip)`;
  return [
    weight.route,
    part("document", weight.document),
    part("styles", weight.styles),
    part("scripts", weight.scripts),
  ].join("  ");
}
