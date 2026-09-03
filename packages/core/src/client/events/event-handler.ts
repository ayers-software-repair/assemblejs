// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { EventMessage } from "./event-message.js";

/** What a subscriber is called with. */
export type EventHandler<P = unknown> = (message: EventMessage<P>) => void;
