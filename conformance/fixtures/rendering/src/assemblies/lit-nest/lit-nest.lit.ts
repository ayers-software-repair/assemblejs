// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { slot } from "@assemblejs/renderer-lit/client";
import { html } from "lit";

export default () => html`<section class="nest" data-parent="lit">${slot("vue-label")}</section>`;
