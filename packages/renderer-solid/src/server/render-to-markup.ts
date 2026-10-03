// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { MarkupInput } from "@assemblejs/core";
import { serverEvents } from "@assemblejs/core/client";
import { createComponent } from "solid-js";
import type { Component } from "solid-js";
import { renderToString } from "solid-js/web";
import { EventsContext } from "../client/events-context.js";
import type { AssemblyProps } from "../props/assembly-props.js";

/**
 * Renders a Solid component to the markup the server sends, with the hydration keys the browser
 * half adopts it by.
 *
 * It does not catch: a failed render throws, the composer catches it, and the placement falls
 * back. The component renders inside the same events context it hydrates inside, holding the
 * server's events, so a component that calls `useEvents()` renders on the server as in the
 * browser.
 */
export function renderToMarkup(component: Component<AssemblyProps>, input: MarkupInput): string {
  return renderToString(() =>
    createComponent(EventsContext.Provider, {
      value: serverEvents(),
      get children() {
        return createComponent(component, { data: input.data, children: input.children });
      },
    }),
  );
}
