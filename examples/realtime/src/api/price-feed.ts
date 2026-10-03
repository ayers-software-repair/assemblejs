// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { StreamContext } from "@assemblejs/core";

/** Every open stream's send, for the push api to reach each page that is listening. */
export const priceFeed = new Set<StreamContext["send"]>();
