// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { FRAMEWORK_ROUTE_PREFIX } from "./framework-route-prefix.js";

/**
 * Where the page's server passes on a call to the api of a server it places assemblies from:
 * `<prefix>/<the remote's origin, percent-encoded>/api/...`. Under the framework's own prefix,
 * always.
 */
export const RELAY_ROUTE_PREFIX = `${FRAMEWORK_ROUTE_PREFIX}/remote`;
