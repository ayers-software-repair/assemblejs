// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * When an assembly's browser half runs.
 *
 * `none` is a mode, not an accident: an assembly declared static ships no JavaScript at all,
 * and that is a thing an author chooses rather than a thing that happens to be true today.
 */
export type MountMode = "load" | "idle" | "visible" | "none";
