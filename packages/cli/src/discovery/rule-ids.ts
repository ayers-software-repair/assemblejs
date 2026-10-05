// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Every rule a project problem can name. A problem's rule is typed from this list, so the
 * compiler refuses one the agent surface's `explain` could not answer, and that package's tests
 * hold its rules to exactly these.
 */
export const RULE_IDS = [
  "directory-is-an-assembly",
  "one-framework-per-assembly",
  "the-file-name-says-the-framework",
  "a-directory-is-a-page",
  "an-api-file-is-an-api",
  "a-view-needs-its-renderer",
  "a-placement-names-an-assembly",
  "policy-names-a-placement",
  "a-page-opens-one-stream",
  "the-server-file-never-grows",
  "one-project-per-root",
  "an-assembly-owns-its-styles",
] as const;
