// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createServer, defineAssembly, defineService } from "@assemblejs/core";
import type { App, LogLine } from "@assemblejs/core";
import { afterAll, beforeAll } from "vitest";

const served = (name: string) =>
  defineAssembly({
    name,
    views: {
      default: {
        renderer: "html",
        data: () => ({ served: name }),
        markup: () => `<button>served ${name}</button>`,
      },
    },
  });

// One whose service throws, so the server answers its fallback envelope under a 500; and one
// whose view places an assembly the server has not, so a child falls back inside an answer
// that stands. Each failure is logged by the server against an id of its own making.
const failing = defineAssembly({
  name: "failing",
  views: {
    default: {
      renderer: "html",
      data: () => {
        throw new Error("the service is down");
      },
      markup: () => "",
    },
  },
});
const holder = defineAssembly({
  name: "holder",
  views: {
    default: {
      renderer: "html",
      markup: () => '<section><assembly name="price"></assembly></section>',
    },
  },
});

// One whose service answers what it was asked with, so a spec sees a route's parameters and a
// query arrive where a visitor's would.
const asked = defineAssembly({
  name: "asked",
  views: {
    default: {
      renderer: "html",
      services: [
        defineService({
          name: "asked",
          run: ({ params, query }) => ({ params: { ...params }, query: Object.fromEntries(query) }),
        }),
      ],
      markup: () => "<p>asked</p>",
    },
  },
});

/**
 * The project's own dev server, as the agent surface finds it: a real server of the framework,
 * listening, started for the specs of the file that asks, with what it logged and `runningFor`,
 * which writes the record of it under a project's root as `dev` does.
 *
 * A real one, because a stand-in answers whatever it is sent: the content endpoint holds every
 * composition header to its shape and refuses a request that does not fit, and the ids of what
 * failed are the server's own, in its own log.
 */
export function devServer(): {
  readonly runningFor: (dir: string) => void;
  readonly logged: () => readonly LogLine[];
} {
  const lines: LogLine[] = [];
  let app: App | undefined;
  let origin = "";
  beforeAll(async () => {
    app = await createServer({
      config: { mode: "production", host: "127.0.0.1", port: 0, auth: undefined },
      assemblies: [served("counter"), served("cart"), served("ok"), failing, holder, asked],
      log: (line) => lines.push(line),
    });
    origin = (await app.listen()).url;
  });
  afterAll(async () => {
    await app?.close();
  });
  return {
    runningFor: (dir) => {
      mkdirSync(join(dir, ".assemblejs"), { recursive: true });
      writeFileSync(join(dir, ".assemblejs", "dev.json"), JSON.stringify({ url: origin }));
    },
    logged: () => lines,
  };
}
