// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { DEVTOOLS_ROUTE_PREFIX } from "./devtools-route-prefix.js";

/**
 * The stream a page reloads by in development: it tells each connection the server's boot. Under
 * the devtools prefix, where nothing may write.
 */
export const DEV_RELOAD_STREAM = `${DEVTOOLS_ROUTE_PREFIX}/reload`;
