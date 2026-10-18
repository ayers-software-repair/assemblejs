// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ClientRenderer } from "@assemblejs/core/client";

// Marks itself ready once it listens, then writes what a ping said and who sent it.
const hearer: ClientRenderer = {
  mount(element, _data, { events }) {
    const line = element.querySelector("p");
    const stop = events.on<{ from: string }>("ping", (message) => {
      line?.setAttribute("data-heard", message.payload.from);
      line?.setAttribute("data-by", message.from.name);
    });
    line?.setAttribute("data-ready", "");
    return { unmount: stop };
  },
};
export default hearer;
