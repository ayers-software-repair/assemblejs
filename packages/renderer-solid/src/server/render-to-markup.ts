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
 * half adopts it by, prefixed with the placement's id so no two islands share one.
 *
 * Rendering is synchronous, because an assembly's data comes from its services. A resource is
 * not rendered on the server: the server sends its Suspense fallback, and hydrating a fallback is
 * not supported (Solid's development build reports it as a mismatch). A lazy component renders on
 * the server only once its module is loaded, which a server does by preloading it. The inline
 * script Solid writes for its own bootstrap is left out: the page's policy refuses it, and for an
 * error a boundary caught it carries the error's message and the server's stack.
 *
 * It does not catch: a failed render throws, the composer catches it, and the placement falls
 * back. The component renders inside the same events context it hydrates inside, holding the
 * server's events, so a component that calls `useEvents()` renders on the server as in the
 * browser.
 */
export function renderToMarkup(component: Component<AssemblyProps>, input: MarkupInput): string {
  const html = renderToString(
    () =>
      createComponent(EventsContext.Provider, {
        value: serverEvents(),
        get children() {
          return createComponent(component, { data: input.data });
        },
      }),
    { renderId: input.id ?? "" },
  );
  return html.replace(SOLID_SCRIPT, "");
}

// The data a Solid render serializes for the browser, which the browser half does not read: one
// script Solid appends after the markup, opening with its cross-reference header.
const SOLID_SCRIPT =
  /<script>\(self\.\$R=self\.\$R\|\|\{\}\)\[[^\]]*\]=\[\];(?:(?!<\/script>)[\s\S])*<\/script>$/;
