// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Limits } from "./limits.js";

/** The bounds composition refuses outside of, unless a server states its own. */
export const DEFAULT_LIMITS: Limits = { depth: 8, maxBytes: 2 * 1024 * 1024 };
