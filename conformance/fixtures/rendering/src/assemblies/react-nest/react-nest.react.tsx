// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { Slot } from "@assemblejs/renderer-react/client";

export default function Nest() {
  return (
    <section className="nest" data-parent="react">
      <Slot name="plain" />
    </section>
  );
}
