// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Last-good content, per placement. Never holds a response to a credentialled request. */
export interface ContentCache {
  get(key: string): { readonly html: string; readonly version?: string } | undefined;
  set(key: string, value: { readonly html: string; readonly version?: string }, ttl: number): void;
}
