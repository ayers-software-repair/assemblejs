// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Who sent a message. Stamped by the runtime, never supplied by the sender. */
export interface EventSender {
  readonly id: string;
  readonly name: string;
  readonly view: string;
}
