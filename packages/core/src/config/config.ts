// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AuthConfig } from "./auth-config.js";
import type { Mode } from "./mode.js";

/** Everything the server was configured with, resolved once, at boot. */
export interface Config {
  readonly mode: Mode;
  readonly host: string;
  readonly port: number;
  /** Absent means the control is off, which is what it is unless it was turned on. */
  readonly auth: AuthConfig | undefined;
}
