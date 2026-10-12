// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Whether an offset falls inside one of a list of stretches, each from its start up to but not
 * including its end, written in order with none overlapping: the form every reader of a
 * template collects them in. Found by halving, so asking of every tag in a long template costs
 * the template's length and not its square.
 */
export function withinSpans(
  spans: ReadonlyArray<readonly [number, number]>,
): (at: number) => boolean {
  return (at) => {
    let low = 0;
    let high = spans.length - 1;
    while (low <= high) {
      const middle = (low + high) >> 1;
      const [start, end] = spans[middle] ?? [0, 0];
      if (at < start) high = middle - 1;
      else if (at >= end) low = middle + 1;
      else return true;
    }
    return false;
  };
}
