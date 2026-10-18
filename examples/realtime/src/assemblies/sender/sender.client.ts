// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ClientRenderer } from "@assemblejs/core/client";

// Sends one ping to the page's bus each time the button is pressed.
const sender: ClientRenderer = {
  mount(element, _data, { events }) {
    const button = element.querySelector("button");
    const send = () => events.send("ping", { from: "page" });
    button?.addEventListener("click", send);
    return { unmount: () => button?.removeEventListener("click", send) };
  },
};
export default sender;
