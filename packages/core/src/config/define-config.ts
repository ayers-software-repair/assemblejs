// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ProjectConfig } from "./project-config.js";

/** Identity, for inference and for a name at the point of declaration. */
export function defineConfig(config: ProjectConfig): ProjectConfig {
  return config;
}
