// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Every rule a project problem can name. A problem's rule is typed from this list, so the
 * compiler refuses one the agent surface's `explain` could not answer, and the rules' own tests
 * hold them to cover every one of these.
 */
export const RULE_IDS = [
  "directory-is-an-assembly",
  "one-framework-per-assembly",
  "the-file-name-says-the-framework",
  "a-directory-is-a-page",
  "an-api-file-is-an-api",
  "a-view-needs-its-renderer",
  "a-template-view-compiles",
  "a-placement-names-an-assembly",
  "a-view-places-a-child-with-the-directive",
  "a-placement-is-named-where-it-is-written",
  "an-assembly-is-never-its-own-ancestor",
  "lit-holds-lit-behind-a-shadow-root",
  "policy-names-a-placement",
  "a-page-opens-one-stream",
  "a-budget-is-whole-bytes",
  "the-server-file-never-grows",
  "one-project-per-root",
  "a-project-stays-inside-its-root",
  "an-assembly-owns-its-styles",
  "agent-instructions-are-current",
] as const;
