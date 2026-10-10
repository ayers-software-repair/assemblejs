// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { Slot } from "@assemblejs/renderer-react/client";

// In a shadow root of its own, where a stylesheet linked by the page does not reach.
export const shadow = true;

export default function Nest() {
  return (
    <section className="nest" data-parent="shadow">
      <Slot name="tinted" />
    </section>
  );
}
