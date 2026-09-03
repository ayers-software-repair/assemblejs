// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// The smallest server the contract allows: one assembly, one view, three endpoints.
// Started with plain node and no bundler present, which is the point.
import { createServer, defineAssembly, readConfig, describeConfig } from "@assemblejs/core";

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

const config = readConfig(process.env);
const app = await createServer({ config, assemblies: [hello], version: "example" });
const { url } = await app.listen();
for (const line of describeConfig(config)) console.log(line);
console.log(`listening ${url}`);
