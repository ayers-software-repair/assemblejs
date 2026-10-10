// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ProjectProblem } from "../discovery/project-problem.js";
import type { ApiShape } from "./api-shape.js";
import type { AssemblyShape } from "./assembly-shape.js";
import type { PageShape } from "./page-shape.js";
import type { SettingsShape } from "./settings-shape.js";

/**
 * A project's whole shape as its sources say it: what exists, and how it is wired. Read, never
 * run, so it is true of a project that has never been built and of one that does not build.
 */
export interface ProjectShape {
  readonly pages: readonly PageShape[];
  readonly assemblies: readonly AssemblyShape[];
  readonly apis: readonly ApiShape[];
  readonly settings: SettingsShape;
  /** Every renderer an assembly here uses, once, in name order. */
  readonly renderers: readonly string[];
  /**
   * What is wrong with the tree itself: a directory that is no page or assembly, a file that is
   * no api. Each with its file, its rule and its fix; `check` reports everything else.
   */
  readonly problems: readonly ProjectProblem[];
}
