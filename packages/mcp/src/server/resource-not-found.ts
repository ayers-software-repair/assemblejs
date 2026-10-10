// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The code the protocol gives a resource that does not exist: "Resource not found: -32002"
 * (the specification of 2025-11-25, server/resources, Error Handling). The SDK's own list of
 * codes does not name it.
 */
export const RESOURCE_NOT_FOUND = -32002;
