// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { LogLine } from "../failure/log-line.js";
import type { ProjectSummary } from "./project-summary.js";

/** What a devtools route is handed: the project, and the failures it logged most recently. */
export interface DevtoolsView {
  readonly project: ProjectSummary;
  /** The latest failures this process logged, oldest first, a bounded number of them. */
  failures(): readonly LogLine[];
}
