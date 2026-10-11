// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The attribute the browser runtime writes on an envelope once its renderer has mounted the
 * assembly, and removes when it unmounts it. The server never writes it: it is the one mark on
 * an envelope that says the assembly is live, for a page, a test or a person to tell a hydrated
 * assembly from one still waiting for its module.
 */
export const MOUNTED_ATTRIBUTE = "data-mounted";
