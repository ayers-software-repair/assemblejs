// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Events } from "./events/events.js";

/**
 * What an assembly's browser half is told about itself, and how it talks to the page.
 *
 * The events object is scoped to this assembly: every subscription made through it is
 * remembered against this mount and removed when the runtime tears it down, so forgetting to
 * unsubscribe is not a thing an author can do.
 */
export interface MountContext {
  readonly id: string;
  readonly name: string;
  readonly view: string;
  readonly events: Events;
}
