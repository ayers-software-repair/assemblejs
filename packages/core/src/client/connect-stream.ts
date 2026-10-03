// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Bus } from "./events/bus.js";
import type { EventSender } from "./events/event-sender.js";
import { readStreamMessage } from "./read-stream-message.js";
import type { StreamSource } from "./stream-source.js";

// Who a message from the stream is from: the server, whose id no assembly's can be, as each
// assembly's is the placement's generated id.
const SERVER: EventSender = { id: "server", name: "server", view: "stream" };

/**
 * Opens a page's one stream and delivers each message onto its bus, where assemblies receive it
 * exactly like any other event: nothing in an assembly knows the message came from the network.
 * A message that does not parse is dropped. The browser's event source reconnects on its own;
 * the returned close ends the connection. The server only sends, so it holds nothing on the bus.
 */
export function connectStream(
  url: string,
  bus: Bus,
  open: (url: string) => StreamSource = (from) => new EventSource(from),
): () => void {
  const source = open(url);
  const { events } = bus.forAssembly(SERVER);
  source.onmessage = (event) => {
    const message = readStreamMessage(String(event.data));
    if (message !== undefined) events.send(message.topic, message.payload, message.to ?? "all");
  };
  return () => source.close();
}
