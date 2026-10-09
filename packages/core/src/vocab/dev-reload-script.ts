// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { DEVTOOLS_ROUTE_PREFIX } from "./devtools-route-prefix.js";

/**
 * The script every page links in development, which reloads it when the server restarts. Under
 * the devtools prefix, where nothing may write.
 */
export const DEV_RELOAD_SCRIPT = `${DEVTOOLS_ROUTE_PREFIX}/reload.js`;
