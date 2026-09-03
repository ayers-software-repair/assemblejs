// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** The process environment, as a value, so reading configuration is a pure function of it. */
export type Environment = Readonly<Record<string, string | undefined>>;
