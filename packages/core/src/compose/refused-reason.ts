// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The refusals a request accounts for once, however many placements each covers: those past
 * how many it may place, and those dispatched for nobody once its asker had left. Every other
 * refusal is one placement's own, with an id of its own.
 */
export type RefusedReason = "too-many" | "aborted";
