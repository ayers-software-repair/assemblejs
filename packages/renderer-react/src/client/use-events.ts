// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Events } from "@assemblejs/core/client";
import { useContext } from "react";
import { EventsContext } from "./events-context.js";

/**
 * This assembly's events object.
 *
 * Every subscription made through it is remembered against this mount and released when the
 * runtime tears it down, so forgetting to unsubscribe is not a thing an author can do.
 *
 * It throws outside an assembly rather than returning undefined: a hook that quietly answers
 * nothing turns a wiring mistake into a component that silently never hears anything.
 */
export function useEvents(): Events {
  const events = useContext(EventsContext);
  if (events === undefined) {
    throw new Error(
      "useEvents was called outside an assembly. It is available inside a component that " +
        "AssembleJS mounted; a component rendered by hand has no page to talk to.",
    );
  }
  return events;
}
