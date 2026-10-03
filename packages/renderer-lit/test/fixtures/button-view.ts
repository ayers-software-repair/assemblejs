// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { html } from "lit";
import type { AssemblyProps } from "@assemblejs/renderer-lit";

/** A view both test projects build: the server one renders it, the browser one hydrates it. */
export const buttonView = (props: AssemblyProps) =>
  html`<button type="button" @click=${() => props.events.send("pressed", {})}>
    ${String(props.data["label"])}
  </button>`;
