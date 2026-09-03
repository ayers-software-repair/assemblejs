// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The renderers whose view files are their own output.
 *
 * An agent can be shown these immediately, with no build and no bundler, which is what makes
 * the feedback loop worth having. A framework view is source that has to be compiled first, and
 * saying so plainly is more useful than rendering something that is not what will ship.
 */
export const RENDERABLE_WITHOUT_A_BUILD: readonly string[] = ["html", "markdown"];
