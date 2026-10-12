// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import type { CachedContent } from "./cached-content.js";

/** Last-good content, per placement. Never holds a response to a credentialled request. */
export interface ContentCache {
  get(key: string): CachedContent | undefined;
  set(key: string, value: CachedContent, ttl: number): void;
}
