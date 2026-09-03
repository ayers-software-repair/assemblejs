// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { MountMode } from "./mount-mode.js";

const MODES: readonly MountMode[] = ["load", "idle", "visible", "none"];

/**
 * The mount mode an envelope declares, defaulting to `load`.
 *
 * An unrecognised value is `none` rather than `load`: a typo must not silently start executing
 * code on a page whose author was trying to say when it should run.
 */
export function readMountMode(envelope: Element): MountMode {
  const declared = envelope.getAttribute("data-mount");
  if (declared === null || declared === "") return "load";
  return (MODES as readonly string[]).includes(declared) ? (declared as MountMode) : "none";
}
