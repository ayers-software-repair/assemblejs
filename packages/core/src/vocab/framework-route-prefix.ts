// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Everything the framework serves for itself: the browser runtime, devtools, health. Reserved,
 * and never part of the assembly contract, so a product route can never collide with one added
 * in a later version.
 */
export const FRAMEWORK_ROUTE_PREFIX = "/_assemblejs";
