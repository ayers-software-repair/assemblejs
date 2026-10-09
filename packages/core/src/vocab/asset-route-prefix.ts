// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { FRAMEWORK_ROUTE_PREFIX } from "./framework-route-prefix.js";

/** Where a built server serves its browser files. Under the framework's own prefix, always. */
export const ASSET_ROUTE_PREFIX = `${FRAMEWORK_ROUTE_PREFIX}/assets`;
