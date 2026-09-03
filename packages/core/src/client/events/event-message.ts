// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { EventScope } from "./event-scope.js";
import type { EventSender } from "./event-sender.js";

/** One message on the page's bus. */
export interface EventMessage<P = unknown> {
  readonly topic: string;
  readonly payload: P;
  readonly from: EventSender;
  readonly to: EventScope;
  /** Monotonic per page, so two messages are always orderable. */
  readonly seq: number;
}
