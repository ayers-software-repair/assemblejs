// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The origin this bundle's runtime was started for, set by `start`. Each server's bundle holds
 * its own copy of the runtime, so this is per bundle: it is what lets an assembly's browser half
 * know which server it came from.
 */
export const runtimeOrigin: { current: string | undefined } = { current: undefined };
