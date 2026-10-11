// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The bounds a project sets on composition in `assemblejs.config.ts`: how deep it goes and how
 * many placements one request composes. Each is a whole number, and one left out keeps the
 * server's default (DESIGN 3.4). The limit on bytes is the server's own and is not set here.
 */
export interface LimitsConfig {
  /** How many assemblies deep composition may go; zero places nothing at all. */
  readonly depth?: number;
  /** How many placements one request composes, at every depth together; at least one. */
  readonly placements?: number;
}
