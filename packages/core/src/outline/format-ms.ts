// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * A length of time in the fewest words that say it: tenths under ten milliseconds, whole
 * milliseconds under a second, and seconds from there.
 */
export function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)} s`;
  return `${ms < 10 ? Math.round(ms * 10) / 10 : Math.round(ms)} ms`;
}
