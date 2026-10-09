// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The renderers whose view files are their own output: plain html alone.
 *
 * An agent can be shown these immediately, with no build and no bundler, which is what makes
 * the feedback loop worth having. A framework view is source that has to be compiled first, and
 * a template, Markdown included, is source its engine renders; saying so plainly is more useful
 * than showing the source as if it were what will ship.
 */
export const RENDERABLE_WITHOUT_A_BUILD: readonly string[] = ["html"];
