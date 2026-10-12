// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * When each envelope on a page came to be there and came alive, in milliseconds from when the
 * page began, for as long as the page is watched.
 */
export interface EnvelopeStamps {
  /** When the browser put the envelope on the page, for one that was not in the page as sent. */
  readonly arrived: (envelope: Element) => number | undefined;
  /** When the runtime marked the envelope mounted, for one marked while the page was watched. */
  readonly mounted: (envelope: Element) => number | undefined;
  /** Watches a shadow root too, since what happens inside one is not told to the page. */
  readonly watch: (root: Node) => void;
  readonly stop: () => void;
}
