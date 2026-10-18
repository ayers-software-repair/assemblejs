// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { EVENTS_META_NAME } from "../vocab/events-meta-name.js";

/** The remote servers a page admits to its bus, as its head names them, or none. */
export function readEventOrigins(root: ParentNode): readonly string[] {
  const meta = root.querySelector(`meta[name="${EVENTS_META_NAME}"]`);
  return (meta?.getAttribute("content") ?? "").split(" ").filter((origin) => origin !== "");
}
