// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** The parts of what a page sends a visitor before anything mounts, each weighed and budgeted. */
export const PAGE_PARTS = ["document", "styles", "scripts"] as const;
