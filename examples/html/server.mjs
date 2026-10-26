// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// The smallest server the contract allows: one assembly, one view, three endpoints, and one api.
// Started with plain node and no bundler present, which is the point.
import { defineApi, defineAssembly, serve } from "@asmjs/core";

const hello = defineAssembly({
  name: "hello",
  views: {
    default: {
      renderer: "html",
      data: ({ query }) => ({ greeting: `Hello, ${query.get("name") ?? "world"}` }),
      markup: ({ data }) => `<p>${data.greeting}</p>`,
    },
  },
});

const time = defineApi({
  path: "/api/time",
  handle: () => ({ now: new Date().toISOString() }),
});

await serve({
  assemblies: [hello],
  apis: [time],
  version: "example",
});
