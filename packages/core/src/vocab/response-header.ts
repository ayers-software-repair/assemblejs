// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** The two headers every content answer carries, whatever its status. */
export const RESPONSE_HEADER = {
  /** Echoes the assembly served, so a proxy or a mistake is visible. */
  name: "assembly-name",
  /** The version of this assembly's output. A parent holding assets for another discards them. */
  version: "assembly-version",
} as const;
