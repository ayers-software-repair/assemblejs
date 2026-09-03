// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Milliseconds a placement waits before it is a failure. Finite by construction: a placement
 * with no deadline is a page that waits on someone else's outage.
 */
export const DEFAULT_DEADLINE = 3000;
