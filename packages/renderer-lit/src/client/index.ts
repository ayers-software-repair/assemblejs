// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
/** @module @assemblejs/renderer-lit/client */
// The support comes first: Lit elements defined after it hydrate the shadow roots the server sent.
export { HYDRATION_SUPPORT } from "./hydration-support.js";
export { slot } from "./slot.js";
export { litAssemblyInTree } from "./lit-assembly-in-tree.js";
export { hydrate } from "./hydrate.js";
