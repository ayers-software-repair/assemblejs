// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { Slot } from "@assemblejs/renderer-solid/client";

export default function Nest() {
  return (
    <section class="nest" data-parent="solid">
      <Slot name="react-label" />
    </section>
  );
}
