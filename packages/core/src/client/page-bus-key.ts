// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Where the page's one bus is kept on `globalThis`. A registered symbol, so every bundle on the
 * page, each with its own copy of this module, reads the same key.
 */
export const PAGE_BUS_KEY = Symbol.for("assemblejs.page-bus");
