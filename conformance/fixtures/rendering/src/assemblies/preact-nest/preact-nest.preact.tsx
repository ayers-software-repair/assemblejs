// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { Slot } from "@assemblejs/renderer-preact/client";

export default function Nest() {
  return (
    <section class="nest" data-parent="preact">
      <Slot name="ejs-card" />
    </section>
  );
}
