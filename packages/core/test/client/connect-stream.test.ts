// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { connectStream, createBus } from "@assemblejs/core/client";
import type { EventMessage } from "@assemblejs/core/client";
import { fakeStream } from "../fixtures/fake-stream.js";

describe("connecting a page's stream to its bus", () => {
  it("delivers each message to the assemblies it is for, from the server", () => {
    const bus = createBus();
    const heard: Array<[string, EventMessage<unknown>]> = [];
    for (const name of ["cart", "header"]) {
      const { events } = bus.forAssembly({ id: `${name}-1`, name, view: "default" });
      events.on("price", (message) => heard.push([name, message]));
    }
    const stream = fakeStream();
    connectStream("/live", bus, stream.open);
    stream.source.emit('{"topic":"price","payload":3}');
    stream.source.emit('{"topic":"price","payload":4,"to":{"name":"cart"}}');
    stream.source.emit("not a message");
    expect(stream.opened).toEqual(["/live"]);
    expect(heard.map(([name, message]) => [name, message.payload])).toEqual([
      ["cart", 3],
      ["header", 3],
      ["cart", 4],
    ]);
    expect(heard[0]?.[1].from).toEqual({ id: "server", name: "server", view: "stream" });
  });

  it("closes the connection", () => {
    const bus = createBus();
    const stream = fakeStream();
    const close = connectStream("/live", bus, stream.open);
    close();
    expect(stream.closed()).toBe(1);
  });

  // The stream opens while assemblies are still loading, so one may subscribe after a message.
  it("keeps each topic it sends, for an assembly that mounts after the message arrived", () => {
    const bus = createBus();
    const stream = fakeStream();
    connectStream("/live", bus, stream.open);
    stream.source.emit('{"topic":"price","payload":7}');
    const late = bus.forAssembly({ id: "late-1", name: "late", view: "default" });
    expect(late.events.last("price")?.payload).toBe(7);
  });
});
