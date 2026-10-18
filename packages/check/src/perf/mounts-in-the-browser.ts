// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { ENVELOPE_ATTRIBUTE } from "@assemblejs/core";

/** Whether the browser mounts an envelope's assembly: not for `none`, nor a mode it does not know. */
export function mountsInTheBrowser(attributes: Readonly<Record<string, string>>): boolean {
  const declared = attributes[ENVELOPE_ATTRIBUTE.mount] ?? "";
  // The modes the runtime mounts on, and no mode at all, which is load.
  return declared === "" || ["load", "idle", "visible"].includes(declared);
}
