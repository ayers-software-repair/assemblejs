// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { STREAM_META_NAME } from "../vocab/stream-meta-name.js";

/** The stream a page names in its head, which its runtime opens, or undefined for none. */
export function readStreamUrl(root: ParentNode): string | undefined {
  const meta = root.querySelector(`meta[name="${STREAM_META_NAME}"]`);
  const url = meta?.getAttribute("content") ?? "";
  return url === "" ? undefined : url;
}
