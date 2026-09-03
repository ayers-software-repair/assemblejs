// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { EventSender } from "./event-sender.js";
import type { Events } from "./events.js";

/** The page's one bus. Assemblies never hold this; they hold what `forAssembly` returns. */
export interface Bus {
  /**
   * The events object one assembly holds. Every subscription made through it is remembered
   * against that assembly, so the returned release removes exactly the ones it added and no
   * others, which is what makes forgetting to unsubscribe impossible rather than discouraged.
   */
  forAssembly(sender: EventSender): { readonly events: Events; readonly release: () => void };
  /** How many handlers are subscribed, for a leak test to assert against. */
  readonly size: number;
}
