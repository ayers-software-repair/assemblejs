// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
/** @module @assemblejs/renderer-lit/hydration-support */
import { hydrationHook } from "./hydration-hook.js";

/**
 * Lit's support for hydrating elements a server rendered, installed before Lit's element base
 * loads, as it must be. A build imports this first in the page's entry, before any assembly's
 * own module; it is also the browser half's first import, for a page assembled some other way.
 *
 * The support is one hook on the page, which Lit's element base reads once, as it loads. On a
 * page with Lit assemblies from several servers each server's bundle sets it, so a build also
 * has each bundle's element base set its own hook just before it reads it.
 */
// The hook is read by name: a bare import of it would be dropped from this package's build,
// whose `sideEffects` names only the built files.
export const HYDRATION_SUPPORT = typeof hydrationHook === "function";
