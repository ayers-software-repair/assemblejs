// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { html } from "lit";
import type { AssemblyProps } from "@assemblejs/renderer-lit";
import { slot } from "@assemblejs/renderer-lit/client";

/**
 * A view that places a child after a button of its own. Both test projects build it: the server
 * one renders it, the browser one hydrates it around the child the composer placed.
 */
export const shellView = (props: AssemblyProps) =>
  html`<section>
    <button type="button" @click=${() => props.events.send("pressed", {})}>shell</button>
    ${slot("inner")}
  </section>`;
