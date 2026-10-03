// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonValue, StreamContext } from "@assemblejs/core";

/**
 * The latest price, and every open stream's send, for the push api to reach each page that is
 * listening and for a page that connects later to start from.
 */
export const priceFeed = {
  latest: { price: 0 } as JsonValue,
  listening: new Set<StreamContext["send"]>(),
};
