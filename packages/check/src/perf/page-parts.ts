// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The parts of what a page sends a visitor, each weighed and budgeted: the three that load before
 * anything mounts, what the assemblies the browser mounts fetch as they mount, and all of it.
 */
export const PAGE_PARTS = ["document", "styles", "scripts", "mount", "total"] as const;
