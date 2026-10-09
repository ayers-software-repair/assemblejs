// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { lazy } from "solid-js";

/**
 * A lazily loaded component. The server renders it once its module has loaded, which a server
 * does by preloading it; the browser loads it after the island around it has hydrated.
 */
export const Late = lazy(() => import("./late-part.js"));
