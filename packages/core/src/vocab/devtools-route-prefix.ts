// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { FRAMEWORK_ROUTE_PREFIX } from "./framework-route-prefix.js";

/**
 * Where devtools are mounted, in development only. Nothing under it accepts a write: a server
 * with a route here that answers anything but GET or HEAD refuses to boot.
 */
export const DEVTOOLS_ROUTE_PREFIX = `${FRAMEWORK_ROUTE_PREFIX}/devtools`;
