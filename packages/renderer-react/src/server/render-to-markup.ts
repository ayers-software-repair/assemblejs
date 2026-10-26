// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject, MarkupInput } from "@asmjs/core";
import { serverEvents } from "@asmjs/core/client";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { EventsContext } from "../client/events-context.js";
import type { AssemblyProps } from "../props/assembly-props.js";

/**
 * Renders a React component to the markup the server sends.
 *
 * It does not catch. A failed render throws, the composer catches it, and the placement falls
 * back. A renderer that returned its own error markup would produce something that passes every
 * check downstream, so the page looks fine and is wrong.
 *
 * The component renders inside the same events context it hydrates inside, holding the server's
 * events, so a component that calls `useEvents()` renders on the server as it does in the
 * browser instead of failing for want of a page.
 *
 * The ids `useId` makes are numbered from the root of each render, so every island on a page
 * would make the same ones. Each carries the placement's id before it, which the browser half
 * is hydrated with too.
 */
export function renderToMarkup<D extends JsonObject>(
  component: (props: AssemblyProps<D>) => unknown,
  input: MarkupInput,
): string {
  return renderToString(
    createElement(
      EventsContext.Provider,
      { value: serverEvents() },
      createElement(component as never, { data: input.data }),
    ),
    { identifierPrefix: input.id ?? "" },
  );
}
