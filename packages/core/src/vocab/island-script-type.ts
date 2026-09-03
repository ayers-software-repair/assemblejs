// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The type on the island's script tag. `application/json` is not executable, so the browser
 * parses nothing here: the runtime reads the element's text and calls JSON.parse itself.
 */
export const ISLAND_SCRIPT_TYPE = "application/json";
