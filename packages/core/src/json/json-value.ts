// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Anything that survives a round trip through JSON, and nothing that does not. */
export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
