// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { FRAMEWORK_ROUTE_PREFIX } from "./framework-route-prefix.js";

/** The script every page links in development, which reloads it when the server restarts. */
export const DEV_RELOAD_SCRIPT = `${FRAMEWORK_ROUTE_PREFIX}/dev/reload.js`;
