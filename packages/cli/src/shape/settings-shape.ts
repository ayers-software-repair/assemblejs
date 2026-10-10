// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Written } from "./written.js";

/**
 * What `assemblejs.config.ts` declares, field by named field, as written: policy only, since
 * where a project runs and its credentials come from the environment and are in no file.
 * COMPUTED where the config computes a field, UNREAD where the file cannot be read.
 */
export interface SettingsShape {
  /** The config file, from the project's root, when the project has one. */
  readonly file?: string;
  /** The other servers it may place assemblies from, each as written. */
  readonly remotes: Written;
  /** The paths that need no credentials. */
  readonly publicRoutes: Written;
  /** The content security policy it sends in place of the default; null where it keeps the default. */
  readonly contentSecurityPolicy: Written;
  /** Whether it declares an access check of its own. The check is code, and is not shown. */
  readonly authenticate: Written;
  /** What each page may send a visitor, in gzipped bytes by part, which `perf` holds it to. */
  readonly budgets: Written;
}
