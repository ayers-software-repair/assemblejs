// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { FRAMEWORK_ROUTE_PREFIX } from "./framework-route-prefix.js";

/** The stream a page reloads by in development: it tells each connection the server's boot. */
export const DEV_RELOAD_STREAM = `${FRAMEWORK_ROUTE_PREFIX}/dev/reload`;
