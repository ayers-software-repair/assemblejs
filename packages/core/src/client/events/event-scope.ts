// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Who a message is for.
 *
 * Addressable by something the sender can actually name: everyone, one assembly by name, or one
 * instance by id. A bus whose only address is "everyone" makes every assembly filter every
 * message, and the filtering is where the collisions live.
 */
export type EventScope = "all" | { readonly name: string } | { readonly id: string };
