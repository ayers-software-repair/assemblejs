// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** The outline's one control on a page, and the few words that go with it. */
export interface OutlineToolbar {
  readonly element: HTMLElement;
  /** Shows whether the outline is drawn, and what it says of the page while it is. */
  readonly show: (shown: boolean, summary: string) => void;
}
