// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** The part of a browser's event source the runtime uses, so a test can stand in for one. */
export interface StreamSource {
  onmessage: ((event: MessageEvent) => void) | null;
  close(): void;
}
